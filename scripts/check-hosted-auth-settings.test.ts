import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'bun:test';
import { minimumPasswordLength } from '../src/platform/auth-policy.ts';
import { evaluateAuthSettings, expectedFromProject } from './check-hosted-auth-settings.ts';

const yaml = `
environments:
  local: { web_url: http://localhost:3000 }
  staging: { web_url: https://staging.example.test }
  production: { web_url: https://app.example.test/ }
`;

const expected = expectedFromProject({ yaml, captcha: true });

const good = {
  mailer_autoconfirm: false,
  security_update_password_require_reauthentication: true,
  mailer_secure_email_change_enabled: true,
  security_captcha_enabled: true,
  password_min_length: minimumPasswordLength,
  site_url: 'https://app.example.test',
  uri_allow_list: 'https://app.example.test/**,https://staging.example.test/auth/confirm**',
};

describe('expectedFromProject', () => {
  test('takes the production address and every deployed origin, never the local one', () => {
    expect(expected).toEqual({ siteUrl: 'https://app.example.test', origins: ['https://staging.example.test', 'https://app.example.test'], captcha: true });
  });

  test('fails when production has no address yet', () => {
    expect(() => expectedFromProject({ yaml: 'environments: {}', captcha: false })).toThrow('environments.production.web_url');
  });
});

describe('evaluateAuthSettings', () => {
  test('is clean when the hosted project matches what the app relies on', () => {
    expect(evaluateAuthSettings({ config: good, expected })).toEqual([]);
  });

  test.each([
    ['mailer_autoconfirm', true],
    ['security_update_password_require_reauthentication', false],
    ['security_captcha_enabled', false],
    ['password_min_length', minimumPasswordLength - 1],
    ['site_url', 'https://other.example.test'],
    ['uri_allow_list', 'https://app.example.test/**'],
    ['uri_allow_list', '**'],
  ])('reports %s = %p', (key, value) => {
    expect(evaluateAuthSettings({ config: { ...good, [key]: value }, expected }).join('\n')).toContain(key);
  });

  test('never passes a setting it could not read', () => {
    expect(evaluateAuthSettings({ config: {}, expected }).length).toBeGreaterThanOrEqual(6);
  });

  test('does not ask for captcha when the project does not use it', () => {
    const findings = evaluateAuthSettings({ config: { ...good, security_captcha_enabled: false }, expected: { ...expected, captcha: false } });

    expect(findings).toEqual([]);
  });
});

describe('the local stack', () => {
  test('asks for the same minimum password length as the app', () => {
    const config = readFileSync(join(import.meta.dir, '../supabase/config.toml'), 'utf8');

    expect(config).toContain(`minimum_password_length = ${minimumPasswordLength}\n`);
  });
});
