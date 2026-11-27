# Urgent fix in production

The branches and their rules are the `git_strategy:` block of [`.agents/project.yaml`](../../.agents/project.yaml). Promotion is [`promotion.md`](./promotion.md). This page is what changes when it is urgent: the order of work, not the checks.

1. **Confirm it in production** and note when it started. Open a ticket with the steps to reproduce.
2. **Decide: roll back or fix forward.** If the last deployment caused it, redeploy the previous one from Vercel first. A rollback does not undo a database migration: check what the release applied.
3. **Fix** on a branch off the branch your strategy names, with a test that fails without the fix.
4. **Merge** through the pull request check. Do not skip it.
5. **Verify** on the staging address, then promote with `bun run git:promote` (dry run first).
6. **Verify production** at the destination: the deployment status, `/api/health` and the broken flow.
7. **Record** the cause on the ticket, and anything that should have caught it.

A leaked secret is different: revoke it first, then fix the cause.
