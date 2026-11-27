-- One row per user who reached the checkout. Stripe is the source of truth; the webhook copies its state here.
create table public.subscriptions (
  user_id uuid primary key references auth.users (id) on delete cascade,
  stripe_customer_id text not null unique,
  stripe_subscription_id text unique,
  status text not null default 'none',
  price_id text,
  current_period_end timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

-- Only the server writes. A signed-in user reads their own row and nothing else.
revoke all on public.subscriptions from anon, authenticated;
grant select on public.subscriptions to authenticated;
grant select, insert, update, delete on public.subscriptions to service_role;

create policy "read own subscription" on public.subscriptions
  for select to authenticated
  using ((select auth.uid()) = user_id);
