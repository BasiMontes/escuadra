import type { Metadata } from 'next';
import { AuthScreen, requireUser } from '@features/auth';
import { PushToggle, readPushSetup } from '@features/push';
import Link from 'next/link';

export const metadata: Metadata = { title: 'Notifications' };

export default async function NotificationsPage() {
  const user = await requireUser('/notifications');
  const setup = await readPushSetup(user.id);

  return (
    <AuthScreen title="Notifications" footer={<Link className="underline" href="/account">Back to your account</Link>}>
      <PushToggle {...setup} />
    </AuthScreen>
  );
}
