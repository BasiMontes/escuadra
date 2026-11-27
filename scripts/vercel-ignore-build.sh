#!/bin/sh
# Vercel "Ignored Build Step" (`ignoreCommand` in vercel.json). Exit 0 skips the build, exit 1 builds.
# A deployment is skipped only when nothing the app is built from changed since the last successful deployment of
# the branch: documentation, tests, CI and agent files would otherwise use up the daily deployment allowance.
# It fails open: without a previous commit, or when git cannot tell, it builds.
# It lists what to ignore, so a new top-level folder builds by default.

[ -n "$VERCEL_GIT_PREVIOUS_SHA" ] || exit 1
git cat-file -e "$VERCEL_GIT_PREVIOUS_SHA^{commit}" 2>/dev/null || exit 1

git diff --quiet "$VERCEL_GIT_PREVIOUS_SHA" HEAD -- . \
  ':(exclude).agents' \
  ':(exclude).claude' \
  ':(exclude).codex' \
  ':(exclude).context' \
  ':(exclude).github' \
  ':(exclude).husky' \
  ':(exclude).opencode' \
  ':(exclude).pi' \
  ':(exclude).template' \
  ':(exclude).vscode' \
  ':(exclude)docs' \
  ':(exclude)e2e' \
  ':(exclude)test' \
  ':(exclude,glob)*.md' \
  ':(exclude,glob)**/*.test.ts' \
  ':(exclude,glob)**/*.test.tsx' \
  ':(exclude)playwright.config.ts'
