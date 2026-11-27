import { describe, expect, test } from 'bun:test';
import { environmentValue } from './ops-config.ts';

const yaml = `
environments:
  local:
    web_url: http://localhost:3000
  production:
    web_url: https://app.example.test/
    db_project_ref: null
`;

describe('environmentValue', () => {
  test('reads a value of an environment, without a trailing slash', () => {
    expect(environmentValue({ yaml, environment: 'production', key: 'web_url' })).toBe('https://app.example.test');
  });

  test('names the missing value and the file to fill', () => {
    expect(() => environmentValue({ yaml, environment: 'production', key: 'db_project_ref' }))
      .toThrow('environments.production.db_project_ref is not set in .agents/project.yaml');
    expect(() => environmentValue({ yaml, environment: 'staging', key: 'web_url' })).toThrow('environments.staging.web_url');
  });
});
