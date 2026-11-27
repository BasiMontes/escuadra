# Web Push notifications

A signed-in person turns notifications on for a device at `/notifications`, and server code sends them with `notify`. `public/sw.js` shows them and opens the app when they are tapped.

## Set up

1. Create a key pair once: `bunx web-push generate-vapid-keys`. Changing it later invalidates every subscription.
2. Set `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:` an address you read) and `SUPABASE_SECRET_KEY`.
3. Apply the migration to the hosted project: `supabase db push --linked` (dry run first).
4. Add to the privacy policy that the browser maker's push service delivers the notifications.
5. Try it on a real device: turn notifications on and send the test. No automated test reaches a push service.

Without the keys the page says notifications are not available.

## Sending

```ts
await notify({ userId, notification: { title: 'Your report is ready', body: 'Tap to read it.', url: '/reports' } });
```

`notify` does not check who is asking: call it only from server code that has already decided this user should be told.

## What protects it

- The server only stores, and only sends to, the push services of the browser makers. The database enforces the same rule.
- Nobody but the server reads or writes `public.push_subscriptions`.
- A subscription moves to another account only from the browser that holds its keys.
- Up to 10 devices per user. Addresses the service reports as gone are deleted.

## Not included

Scheduled or bulk sending, preferences per kind of notification and delivery statistics. Signing out does not turn notifications off: on a shared device they keep arriving until someone turns them off or signs in and turns them on. On iPhone and iPad, push works only after the app is added to the home screen, which needs a web app manifest.
