#!/bin/sh
# Reject a commit whose author or committer identity is a test placeholder
# (`*@example.com`). A repo-local [user] section in `.git/config`, typically
# left behind by a test, shadows the real global identity: the host then
# attributes the commit to nobody and the audit trail is lost.
#
# Reads `git var` (what git will actually write, env overrides included), so it
# catches the local-config case and `GIT_AUTHOR_EMAIL=` alike.
# Exit 0 = ok, 1 = rejected.

for var in GIT_AUTHOR_IDENT GIT_COMMITTER_IDENT; do
  ident=$(git var "$var" 2>/dev/null) || continue
  case "$ident" in
    *@example.com\>*)
      echo ""
      echo "❌ $var is a placeholder identity: ${ident%% [0-9]*}"
      echo "   A repo-local [user] section in .git/config usually shadows the global one."
      echo "   Fix:  git config --local --unset user.name && git config --local --unset user.email"
      echo "   Check: git config --show-origin user.email"
      exit 1
      ;;
  esac
done
exit 0
