import { describe, expect, test } from 'bun:test';
import { isPushServiceEndpoint } from './endpoint';

describe('isPushServiceEndpoint', () => {
  test.each([
    'https://fcm.googleapis.com/fcm/send/abc:APA91',
    'https://updates.push.services.mozilla.com/wpush/v2/gAAAA',
    'https://web.push.apple.com/QGxyz-abc_123',
    'https://wns2-par02p.notify.windows.com/w/?token=BQY%2Fdef',
  ])('accepts %s', (endpoint) => {
    expect(isPushServiceEndpoint(endpoint)).toBe(true);
  });

  test.each([
    'http://fcm.googleapis.com/fcm/send/abc',
    'https://attacker.test/x',
    'https://169.254.169.254/latest/meta-data/',
    'https://localhost/x',
    'https://fcm.googleapis.com.attacker.test/x',
    'https://fcm.googleapis.com@attacker.test/x',
    'https://fcm.googleapis.com:8443/fcm/send/abc',
    'https://attacker.test/https://fcm.googleapis.com/x',
    'https://evilpush.apple.com/x',
    'https://fcm.googleapis.com',
    'https://fcm.googleapis.com/a b',
    'https://fcm.googleapis.com/a\nb',
    `https://fcm.googleapis.com/${'a'.repeat(2048)}`,
    '',
  ])('refuses %p', (endpoint) => {
    expect(isPushServiceEndpoint(endpoint)).toBe(false);
  });
});
