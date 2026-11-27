/**
 * @fileoverview Canonical variable manifest — the SINGLE SOURCE OF TRUTH for
 * how every environment variable in this repo is routed (D1 of the installer
 * `--variables` design).
 *
 * Today, var routing is scattered across four disconnected lists that drift
 * from each other: `INSTALLER_DEFERRED_VARS` / `MCP_SERVER_SECRETS` in
 * `cli/install.ts`, and `DAY_ZERO_VARS` / `PROJECT_BOUND_VARS` in
 * `cli/doctor.ts`. None of them encodes a *destination* (local vs. the remote
 * backend) or a *scope*. This module replaces all four with one typed
 * `VAR_MANIFEST: VarSpec[]` consumed by `install.ts`, `doctor.ts`, and
 * `update-boilerplate.ts`.
 *
 * `.env.example` stays the human-facing doc that users copy from; it is kept in
 * lockstep with this manifest by `scripts/check-vars.ts`, which asserts that
 * manifest ⇄ `.env.example` agree (fails in CI / pre-commit). The two never
 * drift because the parity check is a hard gate.
 *
 * Remote backend for THIS repo (agentic-dev-boilerplate, DEV) is **Vercel env**
 * (`vercel env add`), scoped per `production` / `preview` / `development` — the
 * repo deploys to Vercel and has no `.github/workflows`. (The sibling QA repo
 * targets GitHub Actions secrets instead; its manifest differs.)
 *
 * NOTE: this is Phase 1 (foundation). The manifest + parity check land here with
 * NO behavior change to the installer. Wiring `install.ts` / `doctor.ts` /
 * `update-boilerplate.ts` to consume `VAR_MANIFEST` is a later phase.
 *
 * Validation mirrors the `validateComponentRegistry` pattern in
 * `cli/lib/updater-core.ts`: `validateVarManifest()` is pure / no-I/O and throws
 * on a malformed entry so a misconfigured manifest fails fast at startup.
 */

import type { IssueTracker } from './issue-tracker.ts';

import { existsSync, readFileSync } from 'node:fs';

import { ISSUE_TRACKERS } from './issue-tracker.ts';

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

/** Where a variable is written. `local` = `.env`; `vercel` = Vercel env. */
export type VarDestination = 'local' | 'vercel';

/** Vercel environment scope a var is set into. */
export type VarScope = 'production' | 'preview' | 'development';

/**
 * Where the installer READS a variable's value from when it needs one.
 *
 * - `env-file` (the default) — the value lives in `.env`. True for every var
 *   with a `local` destination, which is almost all of them.
 * - `atlassian-instance` — resolved by `cli/lib/atlassian-instance.ts` from
 *   `.agents/project.yaml` -> `issue_tracker.atlassian_url`.
 *
 * The second case exists because `ATLASSIAN_URL` is deliberately NOT a local
 * variable: while it sat in `.env`, a stale copy in the process environment
 * shadowed the corrected file (both `bun`'s autoload and `dotenv-cli` skip a
 * var that is already set), and `jira:sync-issues` silently rebuilt the PBI
 * cache from a dead Jira site with exit code 0. The host is project identity,
 * so it is anchored to a versioned file that shows up in a diff.
 *
 * The NAME still has to reach the deploy backend, because a serverless Jira
 * integration cannot read `.agents/project.yaml`. So the var keeps a `vercel`
 * destination and drops `local`: one value, in the yaml, feeding both the local
 * tooling and the remote scope, with no second copy to drift.
 */
export type VarValueSource = 'env-file' | 'atlassian-instance';

/**
 * `required` is either an unconditional boolean or a conditional gate:
 * `{ ifEnv: '<VAR_NAME>' }` means "required only when env var `<VAR_NAME>` is
 * set (non-empty)". DEV has no conditional-required vars today, but the shape is
 * shared with the QA manifest (which gates STAGING_* on `TEST_ENV=staging`).
 */
export type VarRequired = boolean | { ifEnv: string };

/**
 * What the generated varlock schema (`.env.core.schema`, see
 * `cli/lib/env-schema.ts`) says about a variable beyond its name and its
 * sensitivity (`secret` becomes `@sensitive`). Documentation and typing only:
 * the schema requires nothing (ADR-0010), so there is no `required` here.
 *
 *   - `type`     an env-spec type expression, e.g. `email`, `url`. Omitted = string.
 *   - `example`  placeholder printed as `@example` (documentation only).
 *   - `docs`     URL printed as `@docs(...)`.
 *
 * No schema DEFAULT on purpose: `varlock run` injects a default into every
 * process it launches, the agent session included, and a value nobody typed is
 * the kind of copy this design removes.
 */
export interface VarSchemaHints {
  type?: string
  example?: string
  docs?: string
}

export interface VarSpec {
  /** UPPER_SNAKE_CASE env-var name, exactly as it appears in `.env.example`. */
  name: string
  /**
   * One or more write destinations. Includes `local` for every var whose value
   * lives in `.env` — i.e. everything except a var that declares a non-default
   * `valueSource` (see `VarValueSource`), which is never written to `.env` at
   * all. `validateVarManifest` enforces exactly that correspondence.
   */
  destinations: VarDestination[]
  /**
   * Vercel scopes the var is set into when `destinations` includes `vercel`.
   * Omitted (undefined) for local-only vars.
   */
  scopes?: VarScope[]
  /**
   * Where the value is read from. Omitted = `env-file` (the overwhelming
   * default). A var declaring anything else has NO `.env` entry, so it is
   * absent from `.env.example` and exempt from the parity check.
   */
  valueSource?: VarValueSource
  /** Secret value → masked in reports, piped via stdin (never argv) on remote write. */
  secret: boolean
  /** Unconditionally required, or conditionally required via `{ ifEnv }`. */
  required: VarRequired
  /**
   * CRITICAL = project-independent TOOL credential, prompted interactively
   * during the NORMAL installer (`configureMcps` / `configureDayZeroCredentials`).
   * Identical in both boilerplates: ATLASSIAN_URL/EMAIL/API_TOKEN (Jira/acli),
   * RESEND_API_KEY (email testing). Web search is not here: it runs at harness
   * level and keeps its key outside `.env` (`harness-level-mcps.ts`).
   * Everything else is non-critical: never asked at install, never warned about,
   * surfaced only in the closing "Next steps" with an `obtainHint`.
   */
  critical: boolean
  /**
   * Non-critical vars only: where / how to obtain the value, shown verbatim in
   * the installer's "Next steps — finish later" section. Critical vars are
   * prompted at install so they don't need a closing hint.
   */
  obtainHint?: string
  /**
   * Auto-provisioned by the Supabase↔Vercel integration and PULLED via
   * `vercel env pull` (only available inside `bun setup --variables`, since
   * at install time the infra does not exist yet). These vars are NEVER asked
   * at install and NEVER listed individually in the closing next-steps.
   */
  pulledFromInfra?: true
  /** Human note (provenance / where to get the value / why it's tracked). */
  note: string
  /** Schema-only hints for `.env.core.schema`. See `VarSchemaHints`. */
  schema?: VarSchemaHints
  /** Omitted = every project; set = only a project whose resolved tracker matches. */
  tracker?: IssueTracker
}

export interface DeprecatedVar {
  /** UPPER_SNAKE_CASE name of the retired var. */
  name: string
  /** Why it's deprecated + what replaced it (surfaced in migration hints). */
  reason: string
}

// ----------------------------------------------------------------------------
// Manifest content (DEV — §2 of the handoff)
// ----------------------------------------------------------------------------

const ALL_SCOPES: VarScope[] = ['production', 'preview', 'development'];

/**
 * The canonical variable routing table for agentic-dev-boilerplate.
 *
 * Sourced from §2 (DEV table) of the handoff and reconciled against the EXACT
 * var names in `.env.example`, `cli/doctor.ts` `PROJECT_BOUND_VARS`
 * (the 7 POSTGRES_* names + the Supabase set), and `N8N_API_URL` / `N8N_API_KEY`.
 */
export const VAR_MANIFEST: VarSpec[] = [
  // --- CRITICAL tool credentials (project-independent; prompted at install) ---
  // These five are IDENTICAL in both boilerplates and asked interactively during
  // the normal installer. `critical: true` drives `criticalVars()`, which
  // `install.ts` uses to decide what to prompt on a fresh clone. They are NOT
  // pushed to Vercel (they are local tool creds, not app-runtime config).
  // ATLASSIAN_URL is the ONE var that is not a `.env` entry. It is a public
  // hostname, not a secret, and it is project IDENTITY — so it is anchored to
  // `.agents/project.yaml` (versioned, shows up in a diff) instead of a local
  // file a stale process value can shadow in silence. See `VarValueSource`.
  //
  // It keeps a `vercel` destination because the deployed app cannot read the
  // yaml; `runRemote` sources the value from the resolver, so the yaml is the
  // single origin for both the local tooling and the remote scope.
  {
    name: 'ATLASSIAN_URL',
    tracker: 'jira',
    destinations: ['vercel'],
    scopes: ALL_SCOPES,
    valueSource: 'atlassian-instance',
    secret: false,
    required: true,
    critical: true,
    note: 'Atlassian site URL. SOURCE OF TRUTH is .agents/project.yaml -> issue_tracker.atlassian_url, NOT .env — prompted at install and written there. Pushed to Vercel for the serverless Jira integration.',
  },
  {
    name: 'ATLASSIAN_EMAIL',
    tracker: 'jira',
    destinations: ['local'],
    secret: false,
    required: true,
    critical: true,
    note: 'Atlassian account email (acli + scripts/sync-jira-*.ts). Critical tool credential — prompted at install.',
    schema: { type: 'email', docs: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
  },
  {
    name: 'ATLASSIAN_API_TOKEN',
    tracker: 'jira',
    destinations: ['local'],
    secret: true,
    required: true,
    critical: true,
    note: 'Atlassian API token (acli + scripts/sync-jira-*.ts). Critical tool credential — prompted at install.',
    schema: { docs: 'https://id.atlassian.com/manage-profile/security/api-tokens' },
  },
  {
    name: 'RESEND_API_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: true,
    critical: true,
    note: 'Resend API key (transactional email + resend CLI auth). Critical tool credential — prompted at install; app runtime → also reaches Vercel.',
    schema: { docs: 'https://resend.com/api-keys' },
  },
  // --- Supabase project backend (auto-provisioned; pulled from Vercel) ---
  {
    name: 'NEXT_PUBLIC_SUPABASE_URL',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Supabase project URL (browser-safe). App runtime. Vercel+Supabase integration generates only this var.',
    schema: { type: 'url', example: 'https://<project-ref>.supabase.co' },
  },
  {
    name: 'SUPABASE_PUBLISHABLE_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Supabase new-style publishable key (browser-safe, replaces anon key).',
  },
  {
    name: 'NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: true,
    critical: false,
    obtainHint: 'Same value as SUPABASE_PUBLISHABLE_KEY (Supabase dashboard → Project Settings → API). The Supabase↔Vercel integration does not provision this name: set it in .env and in Vercel by hand.',
    note: 'Browser-side copy of the publishable key, read by the Supabase browser client (Next.js only inlines NEXT_PUBLIC_* into client bundles). The legacy NEXT_PUBLIC_SUPABASE_ANON_KEY still works while Supabase keeps the legacy pair.',
  },
  {
    name: 'SUPABASE_SECRET_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Supabase new-style secret key (server only, replaces service_role).',
  },
  {
    name: 'SUPABASE_JWT_SECRET',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Secret used to sign / verify custom JWTs. Known to doctor but not the installer today.',
  },
  // --- Postgres direct connection (auto-provisioned; pulled from Vercel) ---
  {
    name: 'POSTGRES_HOST',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Direct Postgres host for the Supabase project (db.<project-ref>.supabase.co).',
  },
  {
    name: 'POSTGRES_USER',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Postgres user (default: postgres).',
    schema: { example: 'postgres' },
  },
  {
    name: 'POSTGRES_PASSWORD',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Postgres password for the project.',
  },
  {
    name: 'POSTGRES_DATABASE',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Postgres database name (default: postgres).',
    schema: { example: 'postgres' },
  },
  {
    name: 'POSTGRES_URL',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Pooled Postgres connection string (port 6543). Contains the password → secret.',
  },
  {
    name: 'POSTGRES_URL_NON_POOLING',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Direct Postgres connection string (port 5432). Contains the password → secret.',
  },
  {
    name: 'POSTGRES_PRISMA_URL',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`.',
    note: 'Pooled connection with pgbouncer=true (for Prisma ORM). Contains the password → secret.',
  },
  // --- App config (auto-provisioned for the deployed URL; pulled from Vercel) ---
  {
    name: 'NEXT_PUBLIC_APP_URL',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: true,
    critical: false,
    pulledFromInfra: true,
    obtainHint: 'Auto-provisioned by Supabase↔Vercel — pull with `vercel env pull` via `bun setup --variables`. Defaults to http://localhost:3000 locally.',
    note: 'Base URL for auth redirects, OAuth callbacks, email links. Referenced in code; previously untracked by installer AND doctor.',
    schema: { type: 'url', example: 'http://localhost:3000' },
  },
  // --- Automation identity (live-UI validation + authenticated HTTP probes) ---
  // The account browser/HTTP automation logs in as while validating a story
  // against the running app. Declared BY NAME in `.agents/project.yaml` →
  // `testing.automation_identity`; the contract + the prohibition list live in
  // `.agents/skills/sprint-development/references/live-ui-identity.md`.
  //
  // These two names are the RECOMMENDED DEFAULTS, tracked here so `vars:check` /
  // doctor surface a missing automation identity BEFORE a sprint instead of a
  // subagent improvising a login mid-run. A project may rename them — if it does,
  // rename them in this manifest too, so detection keeps working.
  //
  // `required: false` because non-UI projects never drive a browser. Local only:
  // never pushed to Vercel (it is a test identity, not app-runtime config).
  {
    name: 'QA_E2E_USER_EMAIL',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Provision a DEDICATED non-production account (no real data, minimum privileges), then declare its var name in `.agents/project.yaml` → testing.automation_identity.email_var. Never a real user, admin, or production account.',
    note: 'Email of the automation identity used by live-UI validation / authenticated HTTP probes. Local only.',
    schema: { type: 'email', example: 'qa.automation@example.test' },
  },
  {
    name: 'QA_E2E_USER_PASSWORD',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Password of the dedicated automation account above. Read at runtime from .env by the automation script; never inlined in code, plans, or PR bodies.',
    note: 'Password of the automation identity. Local only, secret.',
  },
  // --- n8n automation (non-critical, local only, set when you adopt n8n) ---
  {
    name: 'N8N_API_URL',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Your n8n instance → Settings → API (e.g. https://n8n.yourapp.com/api/v1). Only needed if you use the n8n MCP server.',
    note: 'n8n instance API URL for the n8n MCP server (project-bound). Local only.',
    schema: { type: 'url', example: 'https://n8n.example.test/api/v1' },
  },
  {
    name: 'N8N_API_KEY',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Your n8n instance → Settings → API. Only needed if you use the n8n MCP server.',
    note: 'n8n API key for the n8n MCP server. Local only.',
  },
  // --- BOT PROTECTION - Cloudflare Turnstile (optional) ---
  {
    name: 'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Cloudflare dashboard -> Turnstile -> your widget.',
    note: 'Turnstile site key (browser-safe). Shows the widget on the sign-in forms.',
  },
  {
    name: 'TURNSTILE_SECRET_KEY',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Cloudflare dashboard -> Turnstile -> your widget.',
    note: 'Turnstile secret key, for the hosted Supabase project settings. The app never reads it.',
  },
  // --- ERROR REPORTS - Sentry (optional) ---
  {
    name: 'NEXT_PUBLIC_SENTRY_DSN',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Sentry -> project settings -> Client Keys (DSN).',
    note: 'Sentry DSN (browser-safe). Server and browser error reports.',
    schema: { type: 'url' },
  },
  {
    name: 'SENTRY_ORG',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Sentry -> organization settings.',
    note: 'Sentry organization slug, used by the build to upload source maps.',
  },
  {
    name: 'SENTRY_PROJECT',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Sentry -> project settings.',
    note: 'Sentry project slug, used by the build to upload source maps.',
  },
  {
    name: 'SENTRY_AUTH_TOKEN',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Sentry -> settings -> Auth Tokens.',
    note: 'Sentry token the build uses to upload source maps.',
  },
  // --- ANALYTICS - PostHog (optional) ---
  {
    name: 'NEXT_PUBLIC_POSTHOG_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'PostHog -> project settings.',
    note: 'PostHog project key (a public write key).',
  },
  {
    name: 'NEXT_PUBLIC_POSTHOG_HOST',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'PostHog -> project settings; it depends on the region.',
    note: 'PostHog ingestion host, such as https://eu.i.posthog.com.',
    schema: { type: 'url' },
  },
  {
    name: 'POSTHOG_PERSONAL_API_KEY',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'PostHog -> account settings -> Personal API keys.',
    note: 'PostHog personal API key, to read or erase data from scripts. Nothing in the app base reads it: declared for the module or workflow that will.',
  },
  {
    name: 'POSTHOG_PROJECT_ID',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'PostHog -> project settings.',
    note: 'PostHog numeric project id, used with the personal key. Nothing in the app base reads it: declared for the module or workflow that will.',
  },
  // --- EMAIL FROM THE APP (optional) ---
  {
    name: 'EMAIL_FROM',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'An address on a domain verified in Resend.',
    note: 'Sender address of the app\'s email. Required to send with Resend.',
  },
  {
    name: 'GMAIL_SMTP_USER',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'The Gmail address.',
    note: 'Gmail account that sends when there is no domain.',
    schema: { type: 'email' },
  },
  {
    name: 'GMAIL_SMTP_APP_PASSWORD',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Google account -> Security -> App passwords.',
    note: 'App password of that Gmail account. Setting it selects Gmail.',
  },
  // --- DEPLOY AND SCHEDULED JOBS (optional) ---
  {
    name: 'SUPABASE_DB_PASSWORD',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Supabase dashboard -> Database settings.',
    note: 'Database password of the hosted project, for CLI migrations and backups. Read by the operation workflows as a repository secret (docs/workflows/operations.md).',
  },
  {
    name: 'CRON_SECRET',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Generate a long random string.',
    note: 'Shared secret a scheduled request must send. Nothing in the app base reads it: declared for the module or workflow that will.',
  },
  // --- CLOUDFLARE - R2 backups and Workers AI (optional) ---
  {
    name: 'R2_ACCOUNT_ID',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Cloudflare dashboard -> R2.',
    note: 'Cloudflare account that holds the backup bucket. Read by the operation workflows as a repository secret (docs/workflows/operations.md).',
  },
  {
    name: 'R2_ACCESS_KEY_ID',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Cloudflare dashboard -> R2 -> API tokens.',
    note: 'Access key id of an R2 API token. Read by the operation workflows as a repository secret (docs/workflows/operations.md).',
  },
  {
    name: 'R2_SECRET_ACCESS_KEY',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Shown once when the token is created.',
    note: 'Secret of that R2 API token. Read by the operation workflows as a repository secret (docs/workflows/operations.md).',
  },
  {
    name: 'R2_BUCKET',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Cloudflare dashboard -> R2.',
    note: 'Name of the backup bucket. Read by the operation workflows as a repository secret (docs/workflows/operations.md).',
  },
  {
    name: 'BACKUP_PASSPHRASE',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Generate a long random string and store it away from the backups.',
    note: 'Passphrase that encrypts database backups. Read by the operation workflows as a repository secret (docs/workflows/operations.md).',
  },
  {
    name: 'CLOUDFLARE_ACCOUNT_ID',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Cloudflare dashboard -> account home.',
    note: 'Cloudflare account id for Workers AI. Nothing in the app base reads it: declared for the module or workflow that will.',
  },
  {
    name: 'CLOUDFLARE_API_TOKEN',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Cloudflare dashboard -> API tokens.',
    note: 'Cloudflare API token for Workers AI. Nothing in the app base reads it: declared for the module or workflow that will.',
  },
  // --- PAYMENTS - Stripe (optional module) ---
  {
    name: 'STRIPE_SECRET_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Stripe dashboard -> Developers -> API keys.',
    note: 'Stripe secret key. Use a test key outside production. Read by the stripe module (bun run module:add stripe).',
  },
  {
    name: 'STRIPE_WEBHOOK_SECRET',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Stripe dashboard -> Developers -> Webhooks.',
    note: 'Signing secret of the Stripe webhook endpoint. Read by the stripe module (bun run module:add stripe).',
  },
  {
    name: 'STRIPE_PRICE_ID',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Stripe dashboard -> Product catalogue.',
    note: 'Price the checkout sells. Read by the stripe module (bun run module:add stripe).',
  },
  // --- WEB PUSH - VAPID (optional module) ---
  {
    name: 'NEXT_PUBLIC_VAPID_PUBLIC_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Generate a VAPID key pair.',
    note: 'VAPID public key for push subscriptions. Read by the web-push module (bun run module:add web-push).',
  },
  {
    name: 'VAPID_PRIVATE_KEY',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Generate a VAPID key pair.',
    note: 'VAPID private key that signs push messages. Read by the web-push module (bun run module:add web-push).',
  },
  {
    name: 'VAPID_SUBJECT',
    destinations: ['local', 'vercel'],
    scopes: ALL_SCOPES,
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'An address you own.',
    note: 'Contact sent with push messages (mailto: or https:). Read by the web-push module (bun run module:add web-push).',
  },
  // --- TEST USERS PER ENVIRONMENT (optional) ---
  {
    name: 'DEV_USER_EMAIL',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Create a dedicated test account in that environment.',
    note: 'Email of the test account in the DEV environment.',
    schema: { type: 'email' },
  },
  {
    name: 'DEV_USER_PASSWORD',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Create a dedicated test account in that environment.',
    note: 'Password of the test account in the DEV environment.',
  },
  {
    name: 'PRE_USER_EMAIL',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Create a dedicated test account in that environment.',
    note: 'Email of the test account in the PRE environment.',
    schema: { type: 'email' },
  },
  {
    name: 'PRE_USER_PASSWORD',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Create a dedicated test account in that environment.',
    note: 'Password of the test account in the PRE environment.',
  },
  {
    name: 'PRO_USER_EMAIL',
    destinations: ['local'],
    secret: false,
    required: false,
    critical: false,
    obtainHint: 'Create a dedicated test account in that environment.',
    note: 'Email of the test account in the PRO environment.',
    schema: { type: 'email' },
  },
  {
    name: 'PRO_USER_PASSWORD',
    destinations: ['local'],
    secret: true,
    required: false,
    critical: false,
    obtainHint: 'Create a dedicated test account in that environment.',
    note: 'Password of the test account in the PRO environment.',
  },
];

/**
 * Legacy / renamed keys that may still linger in a stale `.env`. Nothing reads
 * them anymore; surfaced so the updater + doctor can emit a migration hint.
 * Sourced from `cli/doctor.ts` `LEGACY_JIRA_CRED_KEYS`.
 */
export const DEPRECATED_VARS: DeprecatedVar[] = [
  {
    name: 'JIRA_URL',
    reason: 'Replaced by ATLASSIAN_URL (DRY Atlassian credential family). Nothing reads JIRA_URL anymore.',
  },
  {
    name: 'JIRA_USERNAME',
    reason: 'Replaced by ATLASSIAN_EMAIL (DRY Atlassian credential family). Nothing reads JIRA_USERNAME anymore.',
  },
  {
    name: 'JIRA_API_TOKEN',
    reason: 'Replaced by ATLASSIAN_API_TOKEN (DRY Atlassian credential family). Nothing reads JIRA_API_TOKEN anymore.',
  },
  // NOTE: the legacy Supabase keys (SUPABASE_ANON_KEY,
  // NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY) are deliberately
  // NOT listed here. Unlike the JIRA_* rename above (dead — nothing reads them),
  // the legacy anon / service_role keys are a VENDOR coexistence pair: Supabase
  // still provisions them alongside the new sb_publishable / sb_secret keys, both
  // work simultaneously, and the legacy ones stay valid until the end of 2026.
  // The Supabase↔Vercel integration ships both, so a fresh, correct .env has both
  // — flagging them as "obsolete / replaced" alarmed users about a valid setup.
];

// ----------------------------------------------------------------------------
// Errors
// ----------------------------------------------------------------------------

/**
 * Thrown by `validateVarManifest` when a manifest entry is malformed (mirrors
 * `ComponentOverlapError` in `cli/lib/updater-types.ts`). Callers catch this to
 * print a friendly error before exiting — a misconfigured manifest is a
 * maintainer bug that must fail fast at startup.
 */
export class VarManifestError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'VarManifestError';
  }
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

/** Manifest entries whose `destinations` include `dest`. */
export function varsFor(dest: VarDestination): VarSpec[] {
  return VAR_MANIFEST.filter(spec => spec.destinations.includes(dest));
}

/** A spec's value source, with the `env-file` default applied. */
export function valueSourceOf(spec: VarSpec): VarValueSource {
  return spec.valueSource ?? 'env-file';
}

/**
 * Vars whose value actually lives in `.env`. This — NOT the whole manifest — is
 * the set `.env.example` must document and the set the process⇄file drift check
 * compares, because a var sourced elsewhere has no `.env` line to be right or
 * wrong about.
 */
export function envFileVars(): VarSpec[] {
  return VAR_MANIFEST.filter(spec => valueSourceOf(spec) === 'env-file');
}

/**
 * The CRITICAL tool credentials — project-independent vars prompted interactively
 * during the normal installer (ATLASSIAN_URL/EMAIL/API_TOKEN, RESEND_API_KEY).
 * Drives `install.ts`'s day-0 prompt set.
 */
export function criticalVars(tracker: IssueTracker = 'jira'): VarSpec[] {
  return VAR_MANIFEST.filter(spec => spec.critical && appliesToTracker(spec, tracker));
}

export function appliesToTracker(spec: VarSpec, tracker: IssueTracker): boolean {
  return spec.tracker === undefined || spec.tracker === tracker;
}

/**
 * Non-critical vars surfaced in the installer's closing "Next steps — finish
 * later" section. EXCLUDES `pulledFromInfra` vars (auto-provisioned by the
 * Supabase↔Vercel infra and pulled via `bun setup --variables` — they are
 * covered by a single distinct next-steps line, never listed individually).
 */
export function nextStepsVars(): VarSpec[] {
  return VAR_MANIFEST.filter(spec => !spec.critical && spec.pulledFromInfra !== true);
}

/**
 * Vercel scopes for a var (the `scopes` array on its spec), or `[]` if the var
 * is unknown or has no `vercel` destination / no scopes declared.
 */
export function scopesFor(name: string): VarScope[] {
  const spec = VAR_MANIFEST.find(s => s.name === name);
  return spec?.scopes ?? [];
}

/** Whether a var is a secret per the manifest. Unknown vars → `false`. */
export function isManifestSecret(name: string): boolean {
  return VAR_MANIFEST.find(s => s.name === name)?.secret ?? false;
}

/**
 * Resolve a spec's `required` against a concrete env snapshot.
 *
 * - `required: true`  → always required.
 * - `required: false` → never required.
 * - `required: { ifEnv: 'X' }` → required only when `env.X` is set (non-empty).
 */
export function requiredNow(spec: VarSpec, env: Record<string, string | undefined>): boolean {
  if (typeof spec.required === 'boolean') {
    return spec.required;
  }
  const gateValue = env[spec.required.ifEnv];
  return gateValue !== undefined && gateValue.trim().length > 0;
}

/**
 * Parse the declared KEY names from a `.env.example` file. Returns the ordered
 * list of keys (deduped, first occurrence wins). Both active (`KEY=`) and
 * commented (`# KEY=`) declarations are recognized — a commented var is still a
 * "documented" var for parity purposes. Pure comment lines that are not a
 * `KEY=` declaration are ignored.
 *
 * Used by `scripts/check-vars.ts` to assert manifest ⇄ `.env.example` parity.
 */
export function parseDotEnvExampleKeys(path: string): string[] {
  const content = readFileSync(path, 'utf8');
  const keys: string[] = [];
  const seen = new Set<string>();
  for (const rawLine of content.split('\n')) {
    let line = rawLine.trim();
    if (line.length === 0) { continue; }
    // Strip a single leading comment marker so commented declarations
    // (`# KEY=...`) are recognized; preserve the rest of the line.
    if (line.startsWith('#')) {
      line = line.replace(/^#+\s*/, '');
    }
    line = line.replace(/^export\s+/, '');
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=/);
    if (m === null) { continue; }
    const key = m[1];
    if (seen.has(key)) { continue; }
    seen.add(key);
    keys.push(key);
  }
  return keys;
}

/**
 * Parse a real `.env` file into KEY -> VALUE pairs.
 *
 * Deliberately NOT `parseDotEnvExampleKeys` with values bolted on: that function
 * strips a leading `#` so a COMMENTED declaration still counts as documented,
 * which is right for `.env.example` and wrong here. A commented line in `.env` is
 * a variable that is not set, and treating it as set would produce phantom drift.
 *
 * Strips one layer of matching quotes; on an UNQUOTED value a trailing `#`
 * comment is removed. That rule matters in practice: a template line like
 * `SUPABASE_URL=# https://<project-ref>.supabase.co` carries no value at all, and
 * reading the comment as the value would report phantom drift against whatever
 * the process actually holds. A `#` only opens a comment when it starts the value
 * or follows whitespace, so `pass#word` and `https://host/#anchor` survive intact,
 * and a quoted value is never touched.
 *
 * Later definitions win, matching how both `bun` and `dotenv` load a file. Returns
 * an empty map when the file does not exist — callers decide whether that is a
 * skip or an error.
 */
export function parseDotEnvPairs(path: string): Map<string, string> {
  const pairs = new Map<string, string>();
  if (!existsSync(path)) { return pairs; }
  const content = readFileSync(path, 'utf8');
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim().replace(/^export\s+/, '');
    if (line.length === 0 || line.startsWith('#')) { continue; }
    const m = line.match(/^([A-Z_][A-Z0-9_]*)\s*=(.*)$/);
    if (m === null) { continue; }
    let value = m[2].trim();
    const quoted = /^(['"])([\s\S]*)\1$/.exec(value);
    if (quoted) { value = quoted[2]; }
    else { value = value.replace(/(^|\s)#.*$/, '$1').trim(); }
    pairs.set(m[1], value);
  }
  return pairs;
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------

const VALID_DESTINATIONS: ReadonlySet<VarDestination> = new Set(['local', 'vercel']);
const VALID_SCOPES: ReadonlySet<VarScope> = new Set(['production', 'preview', 'development']);
const NAME_RE = /^[A-Z_][A-Z0-9_]*$/;

/**
 * Validate the manifest at config-time. Pure / no I/O — operates on `VAR_MANIFEST`
 * and `DEPRECATED_VARS` only. Throws `VarManifestError` on the first malformed
 * entry so a misconfigured manifest fails fast at startup (mirror of
 * `validateComponentRegistry`).
 *
 * Checks:
 *  - non-empty, UPPER_SNAKE_CASE, unique names
 *  - every var has at least one destination, all destinations valid
 *  - `local` destination iff the value is sourced from `.env` (`valueSource`)
 *  - `scopes` present + valid iff `vercel` is a destination
 *  - conditional `required` references a non-empty gate name
 *  - `tracker`, when set, is one of the resolver's trackers
 *  - critical vars carry no `obtainHint` / `pulledFromInfra` (prompted at install);
 *    non-critical vars declare a non-empty `obtainHint`
 *  - no name appears in BOTH the active manifest and `DEPRECATED_VARS`
 */
export function validateVarManifest(): void {
  const seen = new Set<string>();
  for (const spec of VAR_MANIFEST) {
    if (!NAME_RE.test(spec.name)) {
      throw new VarManifestError(
        `Invalid var name '${spec.name}': must be UPPER_SNAKE_CASE.`,
      );
    }
    if (seen.has(spec.name)) {
      throw new VarManifestError(`Duplicate var '${spec.name}' in VAR_MANIFEST.`);
    }
    seen.add(spec.name);

    if (spec.destinations.length === 0) {
      throw new VarManifestError(`Var '${spec.name}' has no destinations.`);
    }
    for (const dest of spec.destinations) {
      if (!VALID_DESTINATIONS.has(dest)) {
        throw new VarManifestError(`Var '${spec.name}' has invalid destination '${dest}'.`);
      }
    }
    // `local` and `valueSource` are two views of the same fact and must agree:
    // a var written to `.env` is read from `.env`, and a var read from anywhere
    // else must not also be written to `.env` (that would re-create the second
    // copy this whole design exists to remove).
    const source = valueSourceOf(spec);
    const isLocal = spec.destinations.includes('local');
    if (source === 'env-file' && !isLocal) {
      throw new VarManifestError(
        `Var '${spec.name}' must include the 'local' destination (its value is read from .env). `
        + 'Declare a `valueSource` if the value lives somewhere else.',
      );
    }
    if (source !== 'env-file' && isLocal) {
      throw new VarManifestError(
        `Var '${spec.name}' declares valueSource '${source}' but also targets 'local'. `
        + 'A var sourced outside .env must never be written back into it.',
      );
    }

    const hasVercel = spec.destinations.includes('vercel');
    if (hasVercel) {
      if (spec.scopes === undefined || spec.scopes.length === 0) {
        throw new VarManifestError(
          `Var '${spec.name}' targets 'vercel' but declares no scopes.`,
        );
      }
      for (const scope of spec.scopes) {
        if (!VALID_SCOPES.has(scope)) {
          throw new VarManifestError(`Var '${spec.name}' has invalid scope '${scope}'.`);
        }
      }
    }
    else if (spec.scopes !== undefined) {
      throw new VarManifestError(
        `Var '${spec.name}' declares scopes but has no 'vercel' destination.`,
      );
    }

    if (spec.tracker !== undefined && !ISSUE_TRACKERS.includes(spec.tracker)) {
      throw new VarManifestError(`Var '${spec.name}' has unknown tracker '${spec.tracker}'.`);
    }

    if (typeof spec.required !== 'boolean') {
      if (!spec.required.ifEnv || spec.required.ifEnv.trim().length === 0) {
        throw new VarManifestError(
          `Var '${spec.name}' has a conditional 'required' with an empty 'ifEnv' gate.`,
        );
      }
    }

    // Critical vars are prompted at install → they carry no closing-summary
    // metadata. Non-critical vars are surfaced in "Next steps" and must declare
    // how to obtain the value (either an explicit hint OR the infra-pull flag).
    if (spec.critical) {
      if (spec.obtainHint !== undefined) {
        throw new VarManifestError(
          `Critical var '${spec.name}' must NOT set 'obtainHint' (it is prompted at install).`,
        );
      }
      if (spec.pulledFromInfra === true) {
        throw new VarManifestError(
          `Critical var '${spec.name}' cannot be 'pulledFromInfra' (it is a prompted tool credential).`,
        );
      }
    }
    else {
      const hasHint = spec.obtainHint !== undefined && spec.obtainHint.trim().length > 0;
      if (!hasHint) {
        throw new VarManifestError(
          `Non-critical var '${spec.name}' must declare a non-empty 'obtainHint' for the closing next-steps.`,
        );
      }
    }

    if (spec.note.trim().length === 0) {
      throw new VarManifestError(`Var '${spec.name}' has an empty note.`);
    }
  }

  const deprecatedSeen = new Set<string>();
  for (const dep of DEPRECATED_VARS) {
    if (!NAME_RE.test(dep.name)) {
      throw new VarManifestError(
        `Invalid deprecated var name '${dep.name}': must be UPPER_SNAKE_CASE.`,
      );
    }
    if (deprecatedSeen.has(dep.name)) {
      throw new VarManifestError(`Duplicate deprecated var '${dep.name}'.`);
    }
    deprecatedSeen.add(dep.name);
    if (seen.has(dep.name)) {
      throw new VarManifestError(
        `Var '${dep.name}' appears in both VAR_MANIFEST and DEPRECATED_VARS.`,
      );
    }
    if (dep.reason.trim().length === 0) {
      throw new VarManifestError(`Deprecated var '${dep.name}' has an empty reason.`);
    }
  }
}
