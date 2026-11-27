# The app base

A project made from this template starts with a working Next.js app: accounts, security headers, error reporting and analytics behind a cookie choice, email and a health check. Every outside service stays off until its variables are set.

The stack and the folder conventions are the `stack:` block of [`.agents/project.yaml`](../.agents/project.yaml). Because the app is already here, `bun run bootstrap:guard` answers `template-base`: the scaffolding phases of `/project-bootstrap` do not run.

## Run it

Requirements: the Bun version in `.bun-version`, Docker (or a compatible runtime) and the Supabase CLI installed on the machine. CI pins a CLI version in `.github/workflows/pr-check.yml`: keep yours equal, because the keys of `supabase/config.toml` change between versions.

1. `bun install`
2. In a new project, `bun run project:name <name>`. Projects that keep the same Supabase `project_id` share one local database.
3. `bun run db:start`
4. Copy `.env.example` to `.env` (`bun run setup` already does) and set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` with the values of `supabase status`.
5. `bun run dev`, then open `http://localhost:3000`. Local emails land in the mailbox whose address `supabase status` prints.

Only one local stack can run at a time, because every project uses the same ports. `bun run db:types` reads the local database and ignores the hosted `SUPABASE_DB_PASSWORD` of `.env`.

Variables already exported in your shell win over `.env`. A terminal that loaded another project's variables points this app at that project.

## Where the code lives

| Folder | Holds |
| --- | --- |
| `src/app` | Routes. They compose features and nothing else |
| `src/features` | `auth`, `consent`, `health`. Import a feature through its `index.ts` |
| `src/adapters` | Calls to outside services: email, server analytics, Supabase health |
| `src/platform` | Environment, Supabase clients, security policy, observability, UI components |
| `src/proxy.ts` | Per request: analytics forwarding, security policy, session refresh |

The layer rules are enforced by lint. `src/platform/ui` is written by the `shadcn` CLI and left out of ESLint on purpose: an automatic fix there once broke a component.

## Configuration

| Service | Variables | Without them |
| --- | --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | The app starts; private pages fail and the log names the variable |
| Bot protection (Turnstile) | `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | No widget |
| Error reports (Sentry) | `NEXT_PUBLIC_SENTRY_DSN`; `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` to upload source maps on Vercel | Nothing is sent |
| Analytics (PostHog) | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` | Nothing is sent |
| Email | `RESEND_API_KEY` and `EMAIL_FROM`, or `GMAIL_SMTP_USER` and `GMAIL_SMTP_APP_PASSWORD` | The email is logged by subject and skipped |

`NEXT_PUBLIC_*` values are written into the build: change one, build again.

Every variable is declared in `cli/lib/variables-manifest.ts` and documented in `.env.example`; `bun run vars:env:check` fails when the two differ, and a test fails when the app reads one that is not declared. After editing the manifest, run `bun run vars:schema`.

## Each hosted Supabase project

The local stack reads `supabase/config.toml`. A hosted project does not: set these in its dashboard.

- **Site URL and redirect URLs**: the app address, plus `/auth/confirm` on every address that serves the app.
- **Confirm email**: on.
- **Minimum password length**: the same as `minimumPasswordLength` in `src/features/auth/auth-errors.ts`.
- **Secure password change**: on.
- **Bot protection**: Turnstile with its secret key, only after the app that sends the token is deployed. Once on, Supabase rejects every sign-in without one.

## Authentication emails

The base relies on the default Supabase emails, because a new free project without its own SMTP cannot edit them. Their link only opens a session in the browser that asked for it.

With your own SMTP you can edit the templates to link to `/auth/confirm?token_hash={{ .TokenHash }}&type=recovery` (or `type=signup`), which works in any browser. The route already accepts both forms.

## Consent, error reports and analytics

- The cookie banner appears only when Sentry or PostHog is configured.
- Browser error reports and analytics start after a yes and stop on withdrawal. Server error reports are sent without it.
- Analytics goes through `/ingest`, forwarded by `src/proxy.ts` without cookies or authorization. Do not move it to a `rewrites()` entry in `next.config.ts`: that forwards the session cookie to the other server.
- No automatic click capture, session recording or user identification. Turn them on only after reviewing what your pages show.
- No Content-Security-Policy report is sent to Sentry: the browser would send it before consent.
- When the legal texts change, raise `consentVersion` in `src/platform/consent/cookie.ts` so everyone is asked again.
- A new third-party origin needs its own line in `src/platform/security/csp.ts`.

## Tests

| Command | Runs |
| --- | --- |
| `bun run test` | App and tooling unit tests |
| `bun run test:app:random` | App tests in a random order (also nightly in CI) |
| `bun run test:e2e` | Browser tests against the local stack, and only against it |
| `bun run test:e2e:smoke` | The `@smoke` subset |
| `bun run test:db` | SQL tests of row level security and grants, under `supabase/tests` |
| `bun run ci:e2e-wallclock` | How long the CI browser tests take |

`test:e2e` builds the app, so port 3000 must be free. It replaces the Supabase, Sentry, PostHog and Turnstile variables, so it never reaches a hosted service. How to handle a flaky scenario: [`docs/workflows/e2e-flaky-triage.md`](workflows/e2e-flaky-triage.md).

## Optional modules

The base ships without payments or push. Add what the project needs, with the local stack running:

| Command | Adds |
| --- | --- |
| `bun run module:add stripe` | Subscriptions with Stripe: checkout, customer portal and signed webhook |
| `bun run module:add web-push` | Web Push notifications with a service worker |

It copies the module from `modules/`, dates and applies its migration, declares its dependencies and regenerates the database types. It never overwrites a file, and nothing removes a module: add it on a branch, and dropping the branch undoes it (the local database needs `supabase db reset`). Each module explains its setup in `docs/modules/<name>.md`.

After changing a module or the base, `bun run modules:verify` installs each one, and all together, on a throwaway copy and runs every check. It resets the local database.

## Before the first release

- [ ] Name the app for its users: `src/app/layout.tsx` metadata, the home page, `src/app/icon.svg`
- [ ] Replace the placeholder texts in `src/app/privacy` and `src/app/cookies`
- [ ] Generate `DESIGN.md` with `/design-system` and apply its tokens in `src/app/globals.css`
- [ ] Configure the hosted Supabase project
- [ ] Point an uptime monitor at `/api/health`
- [ ] Switch on the operation workflows you need: [`docs/workflows/operations.md`](workflows/operations.md)

## Known limits

- Changing a password does not ask for the current one. Supabase can require it (`require_current_password`) with a newer CLI than the one pinned here; add the field before turning it on.
- No button to resend a confirmation: signing up again sends a new link.
- `/api/health` proves the Supabase Auth service answers, not the database.
- Email sending is tested with simulated transports only.
- Dark mode follows the system; there is no switch.
