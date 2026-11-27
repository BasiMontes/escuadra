-- One row per browser that asked for notifications.
create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  -- The server sends requests to this address, so only the browsers' push services are accepted.
  -- `src/features/push/endpoint.ts` holds the same rule.
  constraint push_subscriptions_endpoint_allowed check (
    char_length(endpoint) <= 2048
    and endpoint ~ '^https://(fcm\.googleapis\.com|updates\.push\.services\.mozilla\.com|([a-z0-9-]+\.)*push\.apple\.com|([a-z0-9-]+\.)*notify\.windows\.com)/\S*$'
  )
);

create index push_subscriptions_user_id_index on public.push_subscriptions (user_id);

-- Only the server touches this table: no policy, and no grant to `anon` or `authenticated`.
alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;
grant select, insert, update, delete on public.push_subscriptions to service_role;
