import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { PROJECT_LEVEL_SKILLS } from '../cli/install.ts';

const root = join(import.meta.dir, '..');
const folders = PROJECT_LEVEL_SKILLS.map(item => `.agents/skills/${item.skill ?? item.package.split('/').at(-1)}/SKILL.md`);

describe('community skills the installer puts in the project', () => {
  // One that is not ignored fails `repo:check` right after setup and lands in the next commit.
  test('are all ignored by git', () => {
    const result = Bun.spawnSync(['git', 'check-ignore', '--no-index', ...folders], { cwd: root, stdout: 'pipe' });

    expect(result.stdout.toString().split('\n').filter(Boolean)).toEqual(folders);
  });
});
