#!/usr/bin/env bun
/**
 * Names a project made from this template: `bun run project:name <name>`.
 * The Supabase `project_id` matters most: two projects that share one also share their local database.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import process from 'node:process';

const validName = /^[a-z][a-z0-9-]{1,38}[a-z0-9]$/;

const places = [
  { file: 'package.json', value: /(?<=^ {2}"name": ")[^"]*/m },
  { file: '.agents/project.yaml', value: /(?<=^ {2}project_name: )\S+/m },
  { file: 'supabase/config.toml', value: /(?<=^project_id = ")[^"]*/m },
];

export function nameProject({ root, name }: { root: string, name: string }): string[] {
  if (!validName.test(name)) { throw new Error(`"${name}" is not a valid name: 3 to 40 lowercase letters, digits or hyphens, starting with a letter`); }
  // Every file is checked before any is written.
  const changes = places.map(({ file, value }) => {
    const text = readFileSync(join(root, file), 'utf8');
    if (!value.test(text)) { throw new Error(`${file}: the line that holds the name was not found, nothing was written`); }
    return { file, text: text.replace(value, name) };
  });
  changes.forEach(({ file, text }) => writeFileSync(join(root, file), text));
  return changes.map(change => change.file);
}

function main(name: string | undefined): number {
  try {
    const files = nameProject({ root: process.cwd(), name: name ?? '' });
    console.log(`Named "${name}" in ${files.join(', ')}`);
    return 0;
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

if (import.meta.main) {
  process.exit(main(process.argv[2]));
}
