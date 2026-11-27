/**
 * @fileoverview PROJECT-OWNED — `bun sync` never overwrites this file.
 *
 * `eslint.config.base.js` is the synced half: the shared options and the
 * `cli/` import-closure block that guards the updater's self-update. Override
 * anything here.
 *
 * `ignores` and `rules` are arrays/objects, so an override REPLACES rather than
 * merges: spread the base value first or you silently drop what upstream added.
 *
 *   ignores: [...BASE_ESLINT_OPTIONS.ignores, 'my-generated-dir/**'],
 *   rules: { ...BASE_ESLINT_OPTIONS.rules, 'no-console': 'error' },
 *
 * Extra project-only config blocks go after the base blocks in the `antfu()`
 * call: later blocks win. Every scoped block the base exports must stay wired
 * here; `bun run agents:compat:check` fails on one that is not.
 */
import antfu from '@antfu/eslint-config';

import { BASE_ESLINT_OPTIONS, CLI_IMPORT_CLOSURE, GUARD_RULES, GUARD_SHAPE } from './eslint.config.base.js';

export default antfu(
  {
    ...BASE_ESLINT_OPTIONS,
    react: true,
    nextjs: true,
    // Files a CLI writes and rewrites in its own layout. Never autofix them: an automatic fix once turned a
    // shadcn `useMemo` callback async and broke the component. Oxlint still checks the layer rules there.
    ignores: [
      ...BASE_ESLINT_OPTIONS.ignores,
      'supabase/config.toml',
      'src/platform/ui/**',
      'modules/**',
      // Temporary: code carried over from the Vite app, linted by Oxlint and type-checked meanwhile.
      // Removed with the layer reorganisation (tasks/plan.md, task 15).
      'src/spa/**',
      'e2e/**',
      'playwright.config.ts',
    ],
  },
  CLI_IMPORT_CLOSURE,
  GUARD_RULES,
  GUARD_SHAPE,
);
