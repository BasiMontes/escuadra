import { createSubscriptionStore } from '../src/adapters/billing/subscriptions';
import { createAdminClient } from '../src/platform/supabase/admin';
import { newAccount, signUpAndConfirm } from './support/account';
import { expect, test } from './support/fixtures';

// The local stack only: it stands in for the webhook, which needs a Stripe account to fire.
async function userIdOf(email: string) {
  const { data, error } = await createAdminClient().auth.admin.listUsers({ perPage: 1000 });
  if (error) { throw error; }
  return data.users.find(user => user.email === email)!.id;
}

test('billing asks a visitor to sign in', async ({ page }) => {
  await page.goto('/billing');

  await expect(page).toHaveURL('/login?next=%2Fbilling');
});

test('without Stripe keys the billing page says payments are unavailable', async ({ page }) => {
  await signUpAndConfirm(page, newAccount());
  await page.goto('/billing');
  await expect(page.getByText('You have no active subscription.')).toBeVisible();

  await page.getByRole('button', { name: 'Subscribe' }).click();

  await expect(page.getByText('Payments are not available yet.')).toBeVisible();
});

test('a saved subscription shows as active to its owner', async ({ page }) => {
  const account = newAccount();
  await signUpAndConfirm(page, account);
  const userId = await userIdOf(account.email);
  const store = createSubscriptionStore();
  await store.save({ userId, customerId: `cus_${userId}`, subscriptionId: `sub_${userId}`, status: 'active', priceId: 'price_e2e', currentPeriodEnd: null });
  expect(await store.userIdByCustomer(`cus_${userId}`)).toBe(userId);

  await page.goto('/billing');

  await expect(page.getByText('Your subscription is active.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Manage subscription' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Subscribe' })).toBeHidden();
});

test('the webhook refuses what it cannot verify', async ({ request }) => {
  const response = await request.post('/api/stripe/webhook', { data: { type: 'invoice.paid' } });

  expect([400, 503]).toContain(response.status());
});
