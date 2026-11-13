import { describe, it, expect, beforeAll, beforeEach, jest } from '@jest/globals';
import { webcrypto } from 'crypto';
import type { Request, Response } from 'express';

// Tokens here are signed for real with a throwaway ES256 key, the same kind of
// key the Supabase project uses, so these tests check the actual signature
// check. Supabase's network is faked: the only URL it answers is the public
// key list, so any call to Supabase's /user endpoint would fail the test.
/* eslint-disable @typescript-eslint/no-explicit-any */
const mockFetch = jest.fn<(url: string) => Promise<any>>();

jest.mock('@config/supabase', () => {
  const { createClient } = jest.requireActual<typeof import('@supabase/supabase-js')>(
    '@supabase/supabase-js'
  );
  const supabaseAdmin = createClient('https://test-project.supabase.co', 'test-key', {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { fetch: ((url: string) => mockFetch(url)) as any },
  });
  return { supabaseAdmin };
});

const prisma: any = {
  user: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
};
jest.mock('@config/database', () => ({ __esModule: true, default: prisma, prisma }));
jest.mock('@modules/gamification/gamification.service', () => ({
  __esModule: true,
  default: { addScore: jest.fn(async () => undefined) },
}));

import { authenticate, optionalAuthenticate } from '../../src/middlewares/authenticate';
import { UnauthorizedError } from '../../src/utils/errors';

const KID = 'test-key-1';
const SUPABASE_ID = 'supabase-user-1';
const activeUser = {
  id: 'user-1',
  email: 'ada@example.com',
  role: 'ATTENDEE',
  tier: 'FREE',
  isActive: true,
  deletedAt: null,
  authProvider: 'google',
};

type Middleware = typeof authenticate;
type KeyPair = { publicKey: webcrypto.CryptoKey; privateKey: webcrypto.CryptoKey };

let signingKeys: KeyPair;
let publicJwk: webcrypto.JsonWebKey;

const toBase64Url = (data: string | ArrayBuffer) => Buffer.from(data as any).toString('base64url');

async function generateKeys(): Promise<KeyPair> {
  return webcrypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, [
    'sign',
    'verify',
  ]) as Promise<KeyPair>;
}

async function signToken(privateKey: webcrypto.CryptoKey, claims: Record<string, unknown>) {
  const header = toBase64Url(JSON.stringify({ alg: 'ES256', typ: 'JWT', kid: KID }));
  const payload = toBase64Url(JSON.stringify(claims));
  const signature = await webcrypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    privateKey,
    Buffer.from(`${header}.${payload}`)
  );
  return `${header}.${payload}.${toBase64Url(signature)}`;
}

function claimsFor(overrides: Record<string, unknown> = {}) {
  const now = Math.floor(Date.now() / 1000);
  return {
    sub: SUPABASE_ID,
    email: activeUser.email,
    aud: 'authenticated',
    role: 'authenticated',
    iat: now,
    exp: now + 3600,
    app_metadata: { provider: 'google' },
    user_metadata: { full_name: 'Ada Lovelace' },
    ...overrides,
  };
}

// Runs the middleware and resolves with whatever it passed to next().
function run(middleware: Middleware, token: string) {
  const req: any = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
  return new Promise<{ req: any; nextArg: unknown }>((resolve) => {
    middleware(req as Request, {} as Response, (nextArg?: unknown) => resolve({ req, nextArg }));
  });
}

const fetchedUrls = () => mockFetch.mock.calls.map(([url]) => url);

beforeAll(async () => {
  signingKeys = await generateKeys();
  const exported = await webcrypto.subtle.exportKey('jwk', signingKeys.publicKey);
  publicJwk = { ...exported, kid: KID, alg: 'ES256', use: 'sig' } as webcrypto.JsonWebKey;
});

beforeEach(() => {
  mockFetch.mockImplementation(async (url: string) => {
    if (url.endsWith('/auth/v1/.well-known/jwks.json')) {
      return { ok: true, status: 200, json: async () => ({ keys: [publicJwk] }) };
    }
    throw new Error(`Unexpected request to ${url}`);
  });
  prisma.user.findUnique.mockResolvedValue(activeUser);
});

describe('authenticate', () => {
  it('signs a user in without asking Supabase who they are', async () => {
    const token = await signToken(signingKeys.privateKey, claimsFor());

    const first = await run(authenticate, token);
    const second = await run(authenticate, token);

    expect(first.nextArg).toBeUndefined();
    expect(first.req.user).toEqual({
      userId: 'user-1',
      email: 'ada@example.com',
      role: 'ATTENDEE',
      tier: 'FREE',
    });
    expect(second.req.user.userId).toBe('user-1');
    // The public keys are fetched at most once and then cached.
    expect(fetchedUrls().every((url) => url.endsWith('/.well-known/jwks.json'))).toBe(true);
    expect(fetchedUrls().length).toBeLessThanOrEqual(1);
  });

  it('loads only the fields it needs from the user row', async () => {
    const token = await signToken(signingKeys.privateKey, claimsFor());

    await run(authenticate, token);

    const query = prisma.user.findUnique.mock.calls[0][0];
    expect(query.where).toEqual({ supabaseId: SUPABASE_ID });
    expect(query.include).toBeUndefined();
    expect(Object.keys(query.select).sort()).toEqual(
      ['authProvider', 'deletedAt', 'email', 'id', 'isActive', 'role', 'tier'].sort()
    );
  });

  it('refuses a token signed with a different key', async () => {
    const otherKeys = await generateKeys();
    const forged = await signToken(otherKeys.privateKey, claimsFor());

    const { req, nextArg } = await run(authenticate, forged);

    expect(nextArg).toBeInstanceOf(UnauthorizedError);
    expect(req.user).toBeUndefined();
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('refuses a token whose claims were edited after signing', async () => {
    const token = await signToken(signingKeys.privateKey, claimsFor());
    const [header, , signature] = token.split('.');
    const editedPayload = toBase64Url(JSON.stringify(claimsFor({ sub: 'someone-else' })));

    const { nextArg } = await run(authenticate, `${header}.${editedPayload}.${signature}`);

    expect(nextArg).toBeInstanceOf(UnauthorizedError);
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('refuses an expired token', async () => {
    const hourAgo = Math.floor(Date.now() / 1000) - 3600;
    const token = await signToken(signingKeys.privateKey, claimsFor({ exp: hourAgo }));

    const { nextArg } = await run(authenticate, token);

    expect(nextArg).toBeInstanceOf(UnauthorizedError);
  });

  it('refuses a deactivated account', async () => {
    prisma.user.findUnique.mockResolvedValue({ ...activeUser, isActive: false });
    const token = await signToken(signingKeys.privateKey, claimsFor());

    const { req, nextArg } = await run(authenticate, token);

    expect(nextArg).toBeInstanceOf(UnauthorizedError);
    expect(req.user).toBeUndefined();
  });
});

describe('optionalAuthenticate', () => {
  it('carries on signed out when the token is bad', async () => {
    const otherKeys = await generateKeys();
    const forged = await signToken(otherKeys.privateKey, claimsFor());

    const { req, nextArg } = await run(optionalAuthenticate, forged);

    expect(nextArg).toBeUndefined();
    expect(req.user).toBeUndefined();
  });
});
