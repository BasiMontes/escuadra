export interface BrowserPush {
  supported: () => boolean
  blocked: () => boolean
  currentEndpoint: () => Promise<string | null>
  // `null` when the person does not allow notifications.
  subscribe: (publicKey: string) => Promise<PushSubscriptionJSON | null>
  // The address that stopped receiving, if there was one.
  unsubscribe: () => Promise<string | null>
}

function decodeKey(key: string) {
  return Uint8Array.from(atob(key.replaceAll('-', '+').replaceAll('_', '/')), character => character.charCodeAt(0));
}

async function currentSubscription() {
  const registration = await navigator.serviceWorker.getRegistration();
  return await registration?.pushManager.getSubscription() ?? null;
}

export const browserPush: BrowserPush = {
  supported: () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window,
  blocked: () => Notification.permission === 'denied',
  currentEndpoint: async () => (await currentSubscription())?.endpoint ?? null,
  async subscribe(publicKey) {
    if (await Notification.requestPermission() !== 'granted') { return null; }
    await navigator.serviceWorker.register('/sw.js');
    const { pushManager } = await navigator.serviceWorker.ready;
    const subscription = await pushManager.getSubscription()
      ?? await pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: decodeKey(publicKey) });
    return subscription.toJSON();
  },
  async unsubscribe() {
    const subscription = await currentSubscription();
    if (!subscription) { return null; }
    await subscription.unsubscribe();
    return subscription.endpoint;
  },
};
