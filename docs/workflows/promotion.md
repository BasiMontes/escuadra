# Promotion gate: source branch to release

The promotion is a fast-forward mirror push of the source branch to the target branches. `bun run git:promote` is the only sanctioned way to do it.

## Why

"What reaches the release branch passed CI" is not a rule while it lives in a comment: the admin who promotes bypasses the required checks, and a push can go out while the run is still `queued`.

## Configuration

`.agents/project.yaml`:

| Key | Meaning |
|---|---|
| `promotion.source` | branch whose head gets promoted |
| `promotion.targets` | branches that receive it, release branch first (add environment mirrors after it) |
| `promotion.workflow` | workflow file that must be green on the source branch |

A missing or incomplete block stops the script: it never guesses branches.

## What the script checks

| Check | Refuses when |
|---|---|
| CI run | the SHA has no push run of `promotion.workflow` on the source branch, or the latest one is pending or not `success` |
| Identity | any commit in the range has an author or committer `*@example.com` |
| Pull request | a commit has no `(#PR)` in its subject and touches more than docs (`docs/`, `.context/`, root `*.md`, top-level `.agents/*.md`). A `SKILL.md` or an instruction section is NOT docs: it changes how the agent behaves. A merge commit is judged by the files it brings in against its first parent |
| Fast-forward | a target is not an ancestor of the source SHA |
| Migrations | the SHA carries a `supabase/migrations` file the hosted project has not applied, or the hosted list cannot be read. A repo without migrations skips this |

Only the latest run counts: a green re-run after a red one passes.

A migration is applied by hand (`supabase db push --linked`, `--dry-run` first), never by a merge or a promotion.

## Usage

```bash
bun run git:promote                              # dry run: shows the verdict, pushes nothing
bun run git:promote --yes                        # pushes source to targets, ff-only, never force
bun run git:promote --yes --override-reason "flake, green on re-run <run url>"
```

`--override-reason` waives the CI-run and pending-migration refusals only: a flake confirmed by re-running, or a data migration meant to run right after the promotion. It never waives a placeholder identity (fix the commit) or a code commit without `(#PR)` (land it through a PR).

**The trail.** A forced promotion creates an annotated tag `promote-override/<UTC stamp>-<sha8>` on the promoted SHA, with date, author, reason and each waived refusal, pushed atomically with the branches. Read it with `git tag -l 'promote-override/*'` and `git show <tag>`.

## The flow

1. Squash-merge the PR into the source branch.
2. Wait for the CI run on the new SHA to finish.
3. `bun run git:promote`, read the verdict, then `bun run git:promote --yes`.
4. Update the tracker and append the session log entry.

Never promote on a `queued` or `in_progress` run, and never reason from tree equality instead of the run.

## Cadence: accumulate, promote in batches

PRs land on the source branch as they are ready. The release branch gets them in a batch, never one promotion per ticket. Every push to it is a production deployment, and hosting plans cap deployments and storage. Previews count too. The exception is an urgent fix, which is its own promotion on purpose.

## Setup on a new project

1. Create the source branch (`staging`) from `main`.
2. Record the strategy in `git_strategy:` through `/git-flow-master`.
3. Protect the branches, then `bun run git:checks verify` and `apply --yes` once the CI job exists.
4. Check parity with `bun run git:policy verify`.
