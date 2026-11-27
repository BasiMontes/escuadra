import { newAccount, signUpAndConfirm } from './support/account';
import { expect, test } from './support/fixtures';

test('notifications ask a visitor to sign in', async ({ page }) => {
  await page.goto('/notifications');

  await expect(page).toHaveURL('/login?next=%2Fnotifications');
});

test('a device is turned on and off, and stays that way after a reload', async ({ page, context }) => {
  await context.grantPermissions(['notifications']);
  // The browser's push service lives on the internet: stand in for it. Everything else is real.
  await page.addInitScript(() => {
    const slot = 'e2e-push-endpoint';
    function fake() {
      const endpoint = localStorage.getItem(slot);
      if (!endpoint) { return null; }
      return {
        endpoint,
        toJSON: () => ({ endpoint, keys: { p256dh: 'p'.repeat(87), auth: 'a'.repeat(22) } }),
        unsubscribe: async () => {
          localStorage.removeItem(slot);
          return true;
        },
      };
    }
    Object.defineProperty(Notification, 'permission', { get: () => 'granted' });
    Notification.requestPermission = async () => 'granted';
    PushManager.prototype.getSubscription = async () => fake() as unknown as PushSubscription;
    PushManager.prototype.subscribe = async () => {
      localStorage.setItem(slot, `https://fcm.googleapis.com/fcm/send/e2e-${crypto.randomUUID()}`);
      return fake() as unknown as PushSubscription;
    };
  });
  await signUpAndConfirm(page, newAccount());
  await page.goto('/notifications');

  await page.getByRole('button', { name: 'Turn on notifications' }).click();
  await expect(page.getByText('Notifications are on for this device.')).toBeVisible();
  const worker = await page.evaluate(async () => (await navigator.serviceWorker.ready).active?.scriptURL);
  expect(worker).toContain('/sw.js');
  await page.reload();
  await expect(page.getByText('Notifications are on for this device.')).toBeVisible();

  await page.getByRole('button', { name: 'Turn off notifications' }).click();
  await expect(page.getByText('Notifications are off for this device.')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Notifications are off for this device.')).toBeVisible();
});

test('an address outside the push services is refused', async ({ page, baseURL }) => {
  await signUpAndConfirm(page, newAccount());

  const response = await page.request.post('/api/push/subscription', {
    headers: { origin: baseURL! },
    data: { endpoint: 'https://169.254.169.254/latest/meta-data/', keys: { p256dh: 'p', auth: 'a' } },
  });

  expect(response.status()).toBe(400);
});
