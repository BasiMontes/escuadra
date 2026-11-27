#!/usr/bin/env bun
/**
 * Prints a value of an environment from `.agents/project.yaml`, the one place that names the deployed addresses:
 *   bun scripts/ops-config.ts production web_url
 * Exit 1 with the missing key when it is not set, so an operation that was switched on half way fails loudly.
 * Needs no installed dependency.
 */

import { readFileSync } from 'node:fs';
import process from 'node:process';

export interface ProjectEnvironments {
  environments?: Record<string, Record<string, unknown> | undefined>
}

export function environmentValue({ yaml, environment, key }: { yaml: string, environment: string, key: string }): string {
  const project = Bun.YAML.parse(yaml) as ProjectEnvironments;
  const value = project.environments?.[environment]?.[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`environments.${environment}.${key} is not set in .agents/project.yaml`);
  }
  return value.trim().replace(/\/+$/, '');
}

if (import.meta.main) {
  const [environment, key] = process.argv.slice(2);
  if (!environment || !key) {
    console.error('Usage: bun scripts/ops-config.ts <environment> <key>');
    process.exit(2);
  }
  try {
    console.log(environmentValue({ yaml: readFileSync('.agents/project.yaml', 'utf8'), environment, key }));
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
