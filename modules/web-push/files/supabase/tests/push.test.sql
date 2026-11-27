begin;
select plan(7);

insert into auth.users (id, email) values ('00000000-0000-0000-0000-00000000000c', 'c@example.test');

create function pg_temp.store(address text) returns void language sql as $$
  insert into public.push_subscriptions (user_id, endpoint, p256dh, auth)
  values ('00000000-0000-0000-0000-00000000000c', address, 'key', 'secret')
$$;

set local role service_role;
select lives_ok($$select pg_temp.store('https://web.push.apple.com/abc')$$, 'the server stores an address of a push service');
select throws_ok($$select pg_temp.store('https://169.254.169.254/latest/meta-data/')$$, '23514', null, 'an internal address is refused');
select throws_ok($$select pg_temp.store('https://fcm.googleapis.com.attacker.test/x')$$, '23514', null, 'a look-alike host is refused');
select throws_ok($$select pg_temp.store('https://fcm.googleapis.com@attacker.test/x')$$, '23514', null, 'a host hidden behind a user name is refused');

set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-0000-0000-00000000000c","role":"authenticated"}';
select throws_ok('select * from public.push_subscriptions', '42501', null, 'a user cannot read the table');
select throws_ok($$select pg_temp.store('https://web.push.apple.com/def')$$, '42501', null, 'a user cannot write the table');

set local role anon;
set local request.jwt.claims = '{"role":"anon"}';
select throws_ok('select * from public.push_subscriptions', '42501', null, 'a visitor reads nothing');

reset role;
select * from finish();
rollback;
