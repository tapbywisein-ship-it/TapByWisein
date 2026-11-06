# CLAUDE.md

TapByWisein is live, with real users. The README covers what the product is; this file
covers how to change it without breaking production. When this file and the code
disagree, trust the code and fix this file.

## How a change reaches production

- Merging to `main` deploys both halves straight away: Vercel builds `Frontend/`,
  Render builds `Backend/Dockerfile`. There is no staging environment. Always work on a
  branch and merge through a reviewed PR.
- **Deploying never changes the database.** The backend container only runs
  `node dist/server.js`. A change to `prisma/schema.prisma` ships new code that expects
  the new columns or tables, but the live database stays as it was until someone applies
  the SQL by hand (see [Database changes](#database-changes)).
- **The backend refuses to start if a required env var is missing.** `src/config/env.ts`
  validates `process.env` with zod and throws on failure, so a new required variable that
  isn't set in Render makes the deploy fail to start, and the change never goes live.
- The backend runs on Render's free tier: after a restart or idle period, the first
  request can take about 50 seconds.

## Never bring back old code

**Don't put back code that `main` has removed or replaced, unless it fixes a serious
problem.** Bugs we had already fixed have come back this way. #108 was built on a copy
of the project from a month earlier, and when its conflicts were resolved, older code
replaced newer fixes:

- `<AnimatedCounter>` on `/events`, removed on 24 Oct, came back without its import and
  crashed `/events` for every visitor (fixed again in #109).
- "Edit Event", limited to draft events on 14 Oct, came back for every event and did
  nothing on published ones (fixed again in #110).

How to avoid it:

- **Treat `main` as the truth.** Your copy of a file that someone else changed is out of
  date. When resolving a conflict, keep `main`'s version of every line you didn't mean to
  change, and add only your own change on top.
- **Before restoring removed code, find out why it was removed:**
  `git log -p -S '<a line of the code>' -- <file>` shows the commit that removed it and
  its reason. If it was removed on purpose, leave it out.
- **Check your branch shows only your work:** after merging `main` into your branch,
  `git diff origin/main...HEAD` must contain only the changes you intended. Any line in
  it that turns newer code back into older code is a revert by accident: undo it.
- **If old code really must come back** (for example, a new change is breaking
  production), say so in the PR description: which commit you're undoing and why.

## Layout

- `Frontend/`: React 18 + Vite + TypeScript SPA, Tailwind, TanStack Query,
  framer-motion, lucide-react.
  - `src/pages/` has public pages at the top level and `attendee/`, `organizer/`,
    `admin/`. Most signed-in pages live in `pages/attendee/` and wrap in `PortalLayout`,
    which picks the attendee or organizer shell.
  - `src/services/*.service.ts` call the API through `services/api.ts`;
    `src/hooks/use*.ts` wrap them in TanStack Query.
  - `src/components/ui/` holds the shared primitives (`Input`, `Textarea`, `Button`, ...).
    Use them instead of raw elements where you can.
  - `@/` is an alias for `Frontend/src/`.
- `Backend/`: Express + Prisma 5 + Postgres (Supabase), Supabase Auth, socket.io,
  Razorpay, Resend.
  - `src/modules/<feature>/` holds `*.routes.ts`, `*.controller.ts`, `*.service.ts` and
    `*.validation.ts` per feature.
  - `src/middlewares/`: `authenticate` / `optionalAuthenticate`, `authorize(...roles)`,
    `authorizeOwnerOrAdmin`, `validate(schema)`.
  - `src/config/env.ts` is the single list of backend env vars.
  - `src/jobs/scheduler.ts` starts node-cron jobs whenever the server runs
    (unless `NODE_ENV=test`).
  - `src/utils/response.ts` has the response helpers.

## Commands

Frontend (`cd Frontend`):

```sh
npm run dev                              # http://localhost:5173
npm run typecheck                        # tsc on tsconfig.app.json + tsconfig.node.json
npm test                                 # vitest
npm run lint
npm run build
```

The live backend's CORS allows `http://localhost:8080` but not 5173, so against it every
request fails ("Unable to load events"). Run `npm run dev -- --port 8080` instead.

Backend (`cd Backend`):

```sh
npm run build    # tsc + tsc-alias; this is CI's backend typecheck
npm test         # jest; tests mock external services and need no .env
npm run lint
```

### Typecheck before you push

`vite build` doesn't typecheck, so an undefined component builds fine and only crashes
in the browser. That's how `/events` went down after #108. In `Frontend/`,
`npm run typecheck` points `tsc` at `tsconfig.app.json` and `tsconfig.node.json`. Don't
change it back to plain `tsc --noEmit`: the root `tsconfig.json` has `"files": []`, so
that checks nothing. CI runs the typecheck, the build and the tests for both halves.

## Safety

- Check `VITE_API_URL` in `Frontend/.env`. If it points at the live backend
  (`founder-card.onrender.com`), then signing in on localhost and registering, RSVPing,
  posting or saving writes real data for real users. Read-only browsing is fine.
- Never run `prisma db push`, `prisma migrate`, `db:seed` or `db:reset` with a production
  `DATABASE_URL`. `db:reset` deletes everything.
- Don't start the backend locally with production credentials: the scheduler's cron jobs
  would run against the live database and could send real emails.
- Test payments only with Razorpay test-mode keys.
- Never commit `.env` files or secrets. Secrets live in the Vercel, Render and Supabase
  dashboards.
- **This repo is public.** Anyone can read commits, PRs and issues. Report security
  problems to the team privately, fix them under a neutral PR title, and keep exploit
  details out of commit messages and PR descriptions.

## Database changes

Any PR that touches `Backend/prisma/schema.prisma`:

1. Adds an idempotent SQL file in `prisma/migrations/<timestamp>_<name>/migration.sql`
   (the pattern the newest migrations use, with `IF NOT EXISTS` and
   `DO $$ ... EXCEPTION WHEN duplicate_object` guards).
2. Is additive where possible: new tables, and new columns that are nullable or have a
   default. Renaming or dropping a column breaks the running code until the deploy
   finishes, so do it in two PRs: stop using the column, then drop it later.
3. Says in its description that the SQL must be applied to the live database before
   merging, and who will apply it. Merge only after that's done.

## Environment variables

- **Backend:** add new variables to `src/config/env.ts` with a `.default(...)` or
  `.optional()` unless the app truly can't run without them. If one is required, set it
  in Render before the PR merges, or the deploy won't start. Also add it to
  `Backend/.env.example`.
- **Frontend:** `VITE_*` values are baked in at build time, so set new ones in Vercel
  before merging. Add them to `Frontend/.env.example`. Never put a secret in a `VITE_*`
  variable: it ships in the JS bundle.

## API and data rules

- **List responses:** `sendPaginated` returns `{ data: [...], pagination }`, so `data` is
  the array itself. Reading `data.items` or `data.leaderboard` has caused bugs more than
  once. Check the backend's real response shape before trusting a frontend type.
- **Only send what the screen needs:** when one user's data reaches another user, use an
  explicit Prisma `select` with public fields. Never return whole `User` rows: they hold
  emails and auth ids.
- **Check ownership in the service:** a request may only change records the caller owns,
  scoped through their parent (for example, a coupon is deleted with both its id and its
  `eventId`, so an id from another event does nothing), unless the caller is an admin.
- **Validate input:** new routes with a body use `validate(schema)` with a zod schema
  from the module's `*.validation.ts`.
- **Background work:** `await` it or add a `.catch` that logs. A floating email promise
  once crashed the whole backend; `unhandledRejection` now only logs, but the work still
  fails silently.

## Frontend conventions

- **Phones:** form fields need 16px text on phones, or iOS Safari zooms in. The shared
  `Input`/`Textarea` handle it; raw `<input>`/`<textarea>` need `text-base sm:text-sm`
  (or `sm:text-xs`). Signed-in pages leave `pb-24 md:pb-8` for the bottom nav.
- **Hooks:** call every hook before any early `return` (Rules of Hooks).
- **Loading and errors:** every query should show a loading state and an error state with a
  Retry, not a blank page.

## Code style

- Keep diffs focused. Don't reformat or restyle code you aren't changing.
- Comments explain why, not what.
- `.gitattributes` keeps LF line endings everywhere. "LF will be replaced by CRLF"
  warnings on Windows are expected.

## Pull requests

- Start every branch from the latest `main` (`git fetch origin`, then
  `git switch -c <branch> origin/main`). Don't keep working in an old branch or a
  separate copy of the project: a branch that started a month earlier is how #108 undid
  newer fixes when its conflicts were resolved.
- Merge `main` into a long-running branch at least daily, so conflicts stay small.
- Resolve conflicts by merging `main` into the branch. Don't force-push or rewrite history.
  After resolving conflicts, run the typecheck and tests again before pushing.
- One branch per change, kept small enough to review. Group related fixes into one PR,
  but don't mix unrelated work (styling, schema changes, new endpoints) in one PR.
- The PR description says the problem, the cause, the fix, and what was tested,
  including what couldn't be tested. Call out any database or env var step.
- Before opening a PR: `npm run typecheck` and `npm test` in `Frontend/`, `npm test` in
  `Backend/`, `npm run build` in each changed half, and a browser check of anything visible.

## Personal settings

Personal preferences that shouldn't apply to the whole team go in `CLAUDE.local.md`
(gitignored), not here.
