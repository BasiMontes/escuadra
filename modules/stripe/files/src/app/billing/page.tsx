import type { Metadata } from 'next';
import { AuthScreen, requireUser } from '@features/auth';
import { BillingActions, isEntitled, readOwnSubscription } from '@features/billing';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Billing' };

export default async function BillingPage({ searchParams }: PageProps<'/billing'>) {
  await requireUser('/billing');
  const subscription = await readOwnSubscription();
  const active = isEntitled(subscription?.status);
  const returned = (await searchParams).checkout === 'success';

  return (
    <AuthScreen title="Billing" footer={<Link className="underline" href="/account">Back to your account</Link>}>
      <p>{active ? 'Your subscription is active.' : 'You have no active subscription.'}</p>
      {returned && !active ? <p role="status">Payment received. It can take a moment to show here: reload the page.</p> : null}
      <BillingActions canSubscribe={!active} canManage={Boolean(subscription?.subscriptionId)} />
    </AuthScreen>
  );
}
