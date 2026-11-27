# Running a deployed project

What to set up once the app is deployed, what each operation workflow does, and what to do when one goes red.

The production address and the Supabase project ref are read from `environments.production` in [`.agents/project.yaml`](../../.agents/project.yaml) (`web_url`, `db_project_ref`). Fill them first.

## How the operation workflows switch on

A new project runs none of them, so it spends no CI minutes and opens no issue. Each one starts when its repository variable is `true` (GitHub: Settings, Secrets and variables, Actions). Running one by hand from the Actions tab works without the variable.

Switched on but half configured, a workflow fails and names what is missing.

Scheduled runs count against the CI minutes of a private repository. Check your plan before turning on the frequent ones.

| Workflow | Switch (variable) | Secrets | Other variables | When |
| --- | --- | --- | --- | --- |
| `db-backup` | `DB_BACKUP_ENABLED` | `SUPABASE_DB_PASSWORD`, `BACKUP_PASSPHRASE`, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET` | `SUPABASE_POOLER_HOST` | daily |
| `db-restore-drill` | `RESTORE_DRILL_ENABLED` | `SUPABASE_ACCESS_TOKEN`, `BACKUP_PASSPHRASE`, the four `R2_*` | `SUPABASE_ORG_ID`, `SUPABASE_REGION` | quarterly |
| `migration-drift` | `MIGRATION_DRIFT_ENABLED` | `SUPABASE_ACCESS_TOKEN`, `SUPABASE_DB_PASSWORD` | none | weekly and on every push to `staging` |
| `hosted-auth-settings` | `AUTH_SETTINGS_CHECK_ENABLED` | `SUPABASE_ACCESS_TOKEN` | `EXPECT_CAPTCHA` (`true` when the project uses Turnstile) | weekly |
| `uptime-monitor` | `UPTIME_MONITOR_ENABLED` | none | none | every 30 minutes, best-effort |
| `login-widget-check` | `LOGIN_WIDGET_CHECK_ENABLED` | none | none | daily; only with Turnstile |

The scheduled workflows run from the default branch. `uptime-monitor` is a backup: point an external monitor at `/api/health` too.

## Vercel

1. Import the repository. Set the variables of `.env.example` that the app reads, per environment.
2. `vercel.json` runs `scripts/vercel-ignore-build.sh`, which skips a deployment when only documentation, tests, CI or agent files changed. A new top-level folder builds by default.
3. Record the addresses in `.agents/project.yaml`.

`NEXT_PUBLIC_*` values are written into the build: after changing one, redeploy.

## Supabase

Set the dashboard as [`docs/app-base.md`](../app-base.md) describes, then turn on `hosted-auth-settings` to keep it that way.

Apply migrations with `supabase db push --linked`, after `--dry-run`. `migration-drift` reports files never applied and changes made outside the repository.

## Backups

`db-backup` dumps the `public`, `auth`, `storage` and `supabase_migrations` schemas, encrypts the file, restores it into a throwaway Postgres, compares row counts and only then uploads it. Files in Supabase Storage are not included: the dump only holds their index.

Setup:

1. Create an R2 bucket and an API token limited to it. Add a lifecycle rule that expires old objects.
2. Create `BACKUP_PASSPHRASE` and keep a copy outside GitHub: without it no backup can be opened.
3. Take `SUPABASE_POOLER_HOST` from the session pooler address in the dashboard.

The schedule is the most data you can lose: a daily run means up to one day.

### Restoring

1. Download a `db-<stamp>.dump.enc` and its `counts.json` from the bucket.
2. Check it: `bun scripts/db-backup.ts verify --in <file> --counts <counts.json>`, with `BACKUP_PASSPHRASE` set.
3. Decrypt: `openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -pass env:BACKUP_PASSPHRASE -in <file> -out restore.dump`.
4. Restore into a new Supabase project with `pg_restore --no-owner --no-privileges`, check it, then point the app at it. Do not restore over the damaged database.
5. Delete `restore.dump`: it holds the data in clear.

`db-restore-drill` does steps 1 to 4 on a project it creates and deletes, and opens an issue with the timings. It needs room for one more project in the organization.

## When one goes red

| Issue opened | First look |
| --- | --- |
| Database backup failed | The run log. Until a run succeeds, the newest backup keeps ageing |
| Database restore drill failed | The run log, and delete any `restore-drill` project left behind |
| Migrations differ from the production database | The run log lists each version |
| Hosted Auth settings differ | The run log names each setting and the expected value |
| Production health check failing | `/api/health`, the Vercel deployment, the Supabase status |
| The Turnstile widget does not render on /login | The site key in Vercel, `src/platform/security/csp.ts`, the widget in Cloudflare |

## Secrets

The pull request check reads none: it tests against a local Supabase stack. Keep it that way, because that job runs the code of every pull request.
