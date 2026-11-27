// Service worker for Web Push only: it shows what arrives and opens the app when it is tapped. It caches nothing.
// To remove it from browsers, publish a version that calls `globalThis.registration.unregister()`.

function read(data) {
  try {
    return data?.json() ?? {};
  }
  catch {
    // A message that cannot be read still has to show something: browsers expect it.
    return {};
  }
}

globalThis.addEventListener('push', (event) => {
  const { title = 'Notification', body = '', url = '/' } = read(event.data);
  event.waitUntil(globalThis.registration.showNotification(title, { body, data: { url } }));
});

async function open(url) {
  const { origin } = globalThis.location;
  const requested = new URL(url ?? '/', origin);
  const target = requested.origin === origin ? requested.href : `${origin}/`;
  const tabs = await globalThis.clients.matchAll({ type: 'window', includeUncontrolled: true });
  const tab = tabs.find(candidate => candidate.url === target);
  return tab ? tab.focus() : globalThis.clients.openWindow(target);
}

globalThis.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(open(event.notification.data?.url));
});
