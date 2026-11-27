begin;
select plan(6);

insert into auth.users (id, email) values
  ('00000000-0000-0000-0000-00000000000a', 'a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'b@example.test');
insert into public.subscriptions (user_id, stripe_customer_id, status) values
  ('00000000-0000-0000-0000-00000000000a', 'cus_a', 'active'),
  ('00000000-0000-0000-0000-00000000000b', 'cus_b', 'none');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000b","role":"authenticated"}';

select results_eq('select stripe_customer_id from public.subscriptions', array['cus_b'], 'a user reads only their own subscription');
select throws_ok($$update public.subscriptions set status = 'active'$$, '42501', null, 'a user cannot grant themselves a subscription');
select throws_ok($$insert into public.subscriptions (user_id, stripe_customer_id) values ('00000000-0000-0000-0000-00000000000b', 'cus_x')$$, '42501', null, 'a user cannot insert a row');
select throws_ok('delete from public.subscriptions', '42501', null, 'a user cannot delete a row');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok('select * from public.subscriptions', '42501', null, 'a visitor reads nothing');

reset role;
select results_eq($$select status from public.subscriptions where stripe_customer_id = 'cus_b'$$, array['none'], 'nothing changed');

select * from finish();
rollback;
