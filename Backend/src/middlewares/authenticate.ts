import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@config/supabase';
import prisma from '@config/database';
import { UnauthorizedError } from '@utils/errors';
import logger from '@utils/logger';
import gamificationService from '@modules/gamification/gamification.service';
import { SCORE_VALUES } from '@config/constants';

// getClaims throws a plain Error for an expired token or one with no expiry,
// instead of returning it as `error`. Without this, the error handler would
// answer 500, and the frontend treats only a 401 as "your session ended".
async function verifyToken(token: string) {
  try {
    return await supabaseAdmin.auth.getClaims(token);
  } catch {
    throw new UnauthorizedError('Invalid or expired token');
  }
}

// Only the fields this middleware reads. The profile, card and score used to be
// loaded here too, on every signed-in request, and nothing used them.
const userSelect = {
  id: true,
  email: true,
  role: true,
  tier: true,
  isActive: true,
  deletedAt: true,
  authProvider: true,
} as const;

async function resolveUser(token: string) {
  // getClaims checks the token's signature on this server against Supabase's
  // public signing keys (fetched once, then cached for 10 minutes), so a request
  // no longer waits on a call to Supabase. getUser made that call every time.
  // Trade-off: a token stays valid until it expires even after sign-out;
  // deactivated accounts are still refused by the isActive check below.
  const { data, error } = await verifyToken(token);
  if (error || !data) {
    throw new UnauthorizedError('Invalid or expired token');
  }

  const claims = data.claims;
  const email = claims.email;
  if (!email) throw new UnauthorizedError('Token has no email');

  // Try supabaseId first, then fall back to email
  let user = await prisma.user.findUnique({
    where: { supabaseId: claims.sub },
    select: userSelect,
  });

  if (!user) {
    user = await prisma.user.findUnique({ where: { email }, select: userSelect });

    if (user) {
      // Link supabaseId on first login
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          supabaseId: claims.sub,
          isEmailVerified: true,
          authProvider: claims.app_metadata?.provider ?? user.authProvider,
        },
        select: userSelect,
      });
      // Award first-login bonus now that we've linked the account
      gamificationService
        .addScore(user.id, 'FIRST_LOGIN', SCORE_VALUES.FIRST_LOGIN)
        .catch((err) =>
          logger.warn('Failed to award FIRST_LOGIN score', { userId: user!.id, err })
        );
    } else {
      // Auto-create user from Supabase profile (Google OAuth new user)
      const meta = claims.user_metadata ?? {};
      const fullName: string = meta.full_name ?? meta.name ?? '';
      const nameParts = fullName.trim().split(/\s+/).filter(Boolean);
      const firstName = meta.given_name ?? nameParts[0] ?? 'User';
      const rawLast = meta.family_name ?? nameParts.slice(1).join(' ') ?? '';
      // Prevent duplicate: if family_name === given_name (some Google accounts), drop it
      const lastName = rawLast === firstName ? '' : rawLast;
      const avatar: string | undefined = meta.avatar_url ?? meta.picture;

      // Never trust a client-supplied role. `signup_role` lives in Supabase
      // user_metadata, which the user controls — honoring it would let anyone
      // self-grant ORGANIZER at signup. Everyone starts as ATTENDEE and becomes
      // an organizer through an explicit in-app action.
      user = await prisma.user.create({
        data: {
          email,
          supabaseId: claims.sub,
          googleId: claims.app_metadata?.provider === 'google' ? claims.sub : undefined,
          authProvider: claims.app_metadata?.provider ?? 'email',
          password: null,
          isEmailVerified: true,
          role: 'ATTENDEE',
          profile: {
            create: { firstName, lastName, avatar: avatar ?? null },
          },
          gamification: { create: { fkScore: 0, level: 1 } },
        },
        select: userSelect,
      });

      logger.info('Auto-created user from Supabase auth', { userId: user.id, email });
      // Award first-login bonus for brand-new OAuth users
      gamificationService
        .addScore(user.id, 'FIRST_LOGIN', SCORE_VALUES.FIRST_LOGIN)
        .catch((err) =>
          logger.warn('Failed to award FIRST_LOGIN score', { userId: user!.id, err })
        );
    }
  }

  if (!user.isActive || user.deletedAt) {
    throw new UnauthorizedError('Account is deactivated');
  }

  return user;
}

export const authenticate = (_req: Request, _res: Response, next: NextFunction): void => {
  const req = _req;
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && 'accessToken' in req.cookies) {
    token = req.cookies.accessToken as string;
  }

  if (!token) {
    throw new UnauthorizedError('Authentication token is required');
  }

  resolveUser(token)
    .then((user) => {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role as 'ATTENDEE' | 'ORGANIZER' | 'ADMIN',
        tier: user.tier as 'FREE' | 'FOUNDER',
      };
      next();
    })
    .catch(next);
};

export const optionalAuthenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token: string | undefined;

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  } else if (req.cookies && 'accessToken' in req.cookies) {
    token = req.cookies.accessToken as string;
  }

  if (!token) {
    next();
    return;
  }

  resolveUser(token)
    .then((user) => {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role as 'ATTENDEE' | 'ORGANIZER' | 'ADMIN',
        tier: user.tier as 'FREE' | 'FOUNDER',
      };
      next();
    })
    .catch(() => next());
};
