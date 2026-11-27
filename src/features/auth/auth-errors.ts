import { minimumPasswordLength } from '@/platform/auth-policy';

export const genericAuthError = 'Something went wrong. Try again in a few seconds.';

const tooManyAttempts = 'Too many attempts. Wait a moment and try again.';

const messages = new Map([
  ['invalid_credentials', 'Wrong email or password.'],
  ['email_not_confirmed', 'Confirm your email before signing in. Signing up again sends a new link.'],
  ['weak_password', `Choose a stronger password with at least ${minimumPasswordLength} characters.`],
  ['same_password', 'The new password has to differ from the current one.'],
  ['user_already_exists', 'An account with this email already exists.'],
  ['email_exists', 'An account with this email already exists.'],
  ['reauthentication_needed', 'For security, sign in again before changing your password.'],
  ['over_request_rate_limit', tooManyAttempts],
  ['over_email_send_rate_limit', tooManyAttempts],
  ['captcha_failed', 'We could not verify that you are a person. Try again.'],
]);

export function authErrorMessage(error: { code?: string }): string {
  return messages.get(error.code ?? '') ?? genericAuthError;
}
