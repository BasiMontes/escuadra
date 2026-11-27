import { describe, expect, test } from 'bun:test';
import { authErrorMessage, genericAuthError } from './auth-errors';

describe('authErrorMessage', () => {
  test('explains the errors a person can act on', () => {
    expect(authErrorMessage({ code: 'invalid_credentials' })).toBe('Wrong email or password.');
  });

  test('never shows the raw message of an unknown error', () => {
    expect(authErrorMessage({ code: 'unexpected_failure' })).toBe(genericAuthError);
    expect(authErrorMessage({})).toBe(genericAuthError);
    expect(authErrorMessage({ code: 'toString' })).toBe(genericAuthError);
  });
});
