#!/usr/bin/env bun
/**
 * Reads the Auth settings of the hosted production project (Management API, read only) and fails when one the app
 * relies on differs: they live in the dashboard, where `supabase/config.toml` cannot reach them.
 * A setting it cannot read is a finding, never a pass. Exit 0 = as expected, 1 = findings, 2 = could not read.
 *
 *   SUPABASE_ACCESS_TOKEN   personal access token
 *   EXPECT_CAPTCHA=true     also require bot protection to be on
 */

import type { ProjectEnvironments } from './ops-config.ts';
import { readFileSync } from 'node:fs';
import process from 'node:process';
import { minimumPasswordLength } from '../src/platform/auth-policy.ts';
import { environmentValue } from './ops-config.ts';

export interface ExpectedAuth {
  siteUrl: string
  origins: string[]
  captcha: boolean
}

export function expectedFromProject({ yaml, captcha }: { yaml: string, captcha: boolean }): ExpectedAuth {
  const siteUrl = environmentValue({ yaml, environment: 'production', key: 'web_url' });
  const environments = (Bun.YAML.parse(yaml) as ProjectEnvironments).environments ?? {};
  const origins = Object.entries(environments)
    .filter(([name, values]) => name !== 'local' && typeof values?.web_url === 'string')
    .map(([name]) => environmentValue({ yaml, environment: name, key: 'web_url' }));
  return { siteUrl, origins: [...new Set(origins)], captcha };
}

// A Supabase redirect pattern: `**` crosses slashes, `*` does not.
function redirectPattern(pattern: string): RegExp {
  const source = pattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&').split('**').map(part => part.replaceAll('*', '[^/]*')).join('.*');
  return new RegExp(`^${source}$`);
}

export function evaluateAuthSettings({ config, expected }: { config: Record<string, unknown>, expected: ExpectedAuth }): string[] {
  const findings: string[] = [];
  const mustBe = (key: string, value: boolean) => {
    if (config[key] !== value) { findings.push(`${key}: expected ${value}, got ${JSON.stringify(config[key]) ?? 'nothing'}`); }
  };

  mustBe('mailer_autoconfirm', false);
  mustBe('security_update_password_require_reauthentication', true);
  mustBe('mailer_secure_email_change_enabled', true);
  if (expected.captcha) { mustBe('security_captcha_enabled', true); }

  const length = config.password_min_length;
  if (typeof length !== 'number' || length < minimumPasswordLength) {
    findings.push(`password_min_length: expected at least ${minimumPasswordLength}, got ${JSON.stringify(length) ?? 'nothing'}`);
  }

  const siteUrl = config.site_url;
  if (typeof siteUrl !== 'string' || siteUrl.replace(/\/+$/, '') !== expected.siteUrl) {
    findings.push(`site_url: expected ${expected.siteUrl}, got ${JSON.stringify(siteUrl) ?? 'nothing'}`);
  }

  if (typeof config.uri_allow_list !== 'string') {
    findings.push('uri_allow_list: could not be read');
    return findings;
  }
  const entries = config.uri_allow_list.split(',').map(entry => entry.trim()).filter(Boolean);
  if (entries.some(entry => entry === '*' || entry === '**')) {
    findings.push('uri_allow_list: a bare wildcard accepts any address as a redirect');
  }
  const patterns = entries.map(redirectPattern);
  for (const origin of expected.origins) {
    const link = `${origin}/auth/confirm?next=/account`;
    if (!patterns.some(pattern => pattern.test(link))) { findings.push(`uri_allow_list: does not cover ${link}`); }
  }
  return findings;
}

async function main(): Promise<number> {
  const token = process.env.SUPABASE_ACCESS_TOKEN;
  if (!token) {
    console.error('SUPABASE_ACCESS_TOKEN is not set');
    return 2;
  }
  try {
    const yaml = readFileSync('.agents/project.yaml', 'utf8');
    const ref = environmentValue({ yaml, environment: 'production', key: 'db_project_ref' });
    const expected = expectedFromProject({ yaml, captcha: process.env.EXPECT_CAPTCHA === 'true' });
    const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/config/auth`, {
      headers: { Authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(15_000),
    });
    // The status only: the body of an error is not ours to print into a CI log.
    if (!response.ok) { throw new Error(`Management API answered HTTP ${response.status}`); }
    const findings = evaluateAuthSettings({ config: await response.json() as Record<string, unknown>, expected });
    findings.forEach(finding => console.log(`- ${finding}`));
    console.log(`Hosted Auth settings: ${findings.length === 0 ? 'as expected' : `${findings.length} finding(s)`}`);
    return findings.length === 0 ? 0 : 1;
  }
  catch (error) {
    console.error(`Cannot check the hosted Auth settings: ${error instanceof Error ? error.message : String(error)}`);
    return 2;
  }
}

if (import.meta.main) {
  process.exit(await main());
}
