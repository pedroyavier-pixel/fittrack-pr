-- No credentials belong in this migration. Provision config on the server separately.
create extension if not exists pg_cron;
create extension if not exists pg_net with schema extensions;
create table public.fittrack_push_config (
 id boolean primary key default true check(id),
 public_key text not null, private_jwk jsonb not null, cron_token text not null
);
alter table public.fittrack_push_config enable row level security;
revoke all on public.fittrack_push_config from public,anon,authenticated;
grant all on public.fittrack_push_config to service_role;
create policy server_only on public.fittrack_push_config to service_role using(true) with check(true);
create table public.fittrack_push_subscriptions (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 endpoint text not null unique check(length(endpoint) between 20 and 4096),
 enabled boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.fittrack_push_subscriptions enable row level security;
revoke all on public.fittrack_push_subscriptions from public,anon;
grant select,insert,update,delete on public.fittrack_push_subscriptions to authenticated;
grant all on public.fittrack_push_subscriptions to service_role;
create index fittrack_push_owner_idx on public.fittrack_push_subscriptions(user_id);
create policy owner_select on public.fittrack_push_subscriptions for select to authenticated using((select auth.uid())=user_id);
create policy owner_insert on public.fittrack_push_subscriptions for insert to authenticated with check((select auth.uid())=user_id);
create policy owner_update on public.fittrack_push_subscriptions for update to authenticated using((select auth.uid())=user_id) with check((select auth.uid())=user_id);
create policy owner_delete on public.fittrack_push_subscriptions for delete to authenticated using((select auth.uid())=user_id);
create trigger touch_push_updated_at before update on public.fittrack_push_subscriptions for each row execute function public.fittrack_touch_updated_at();
create table public.fittrack_push_deliveries (
 subscription_id uuid not null references public.fittrack_push_subscriptions(id) on delete cascade,
 pr_date date not null, slot integer not null check(slot in(17,20)),
 status text not null default 'claimed', response_code integer,
 created_at timestamptz not null default now(),
 primary key(subscription_id,pr_date,slot)
);
alter table public.fittrack_push_deliveries enable row level security;
revoke all on public.fittrack_push_deliveries from public,anon,authenticated;
grant all on public.fittrack_push_deliveries to service_role;
create policy server_only on public.fittrack_push_deliveries to service_role using(true) with check(true);
-- Invoker rights: service_role is the only caller. Claiming is atomic and idempotent.
create function public.fittrack_claim_push(p_at timestamptz default now())
returns table(id uuid,user_id uuid,endpoint text,pr_date date,slot integer)
language sql volatile security invoker set search_path='' as $$
 with t as (select p_at at time zone 'America/Puerto_Rico' as pr), due as (
 select s.id,s.user_id,s.endpoint,t.pr::date as pr_date,extract(hour from t.pr)::integer as slot
 from public.fittrack_push_subscriptions s cross join t
 where s.enabled and extract(hour from t.pr) in(17,20) and extract(minute from t.pr)<10
 and coalesce((select p.data->>'type' from public.fittrack_workout_plans p where p.user_id=s.user_id and p.deleted_at is null and p.data->>'day'=extract(dow from t.pr)::integer::text order by p.updated_at desc limit 1),case when extract(dow from t.pr) in(1,2,4,5) then 'strength' else 'rest' end)='strength'
 and not exists(select 1 from public.fittrack_workout_sets w where w.user_id=s.user_id and w.local_date=t.pr::date and w.deleted_at is null and w.data->>'completed'='true')
 and not exists(select 1 from public.fittrack_cardio_logs c where c.user_id=s.user_id and c.local_date=t.pr::date and c.deleted_at is null)
 and not exists(select 1 from public.fittrack_workout_sessions w where w.user_id=s.user_id and w.local_date=t.pr::date and w.deleted_at is null and coalesce(w.data->>'endedAt','')<>'')
 ), claimed as (
 insert into public.fittrack_push_deliveries(subscription_id,pr_date,slot)
 select d.id,d.pr_date,d.slot from due d on conflict do nothing returning subscription_id
 ) select d.* from due d join claimed c on c.subscription_id=d.id;
$$;
revoke all on function public.fittrack_claim_push(timestamptz) from public,anon,authenticated;
grant execute on function public.fittrack_claim_push(timestamptz) to service_role;
-- 21:00 UTC=17:00 PR; 00:00 UTC=20:00 on the previous PR calendar day.
select cron.schedule('fittrack-workout-push','0 0,21 * * *',$cron$
 select net.http_post(
 url:='https://rdomgmmqmkczdaxnmqos.supabase.co/functions/v1/fittrack-push',
 headers:=jsonb_build_object('Content-Type','application/json','x-fittrack-cron',(select cron_token from public.fittrack_push_config where id)),
 body:='{}'::jsonb, timeout_milliseconds:=15000
 ) where exists(select 1 from public.fittrack_push_config where id);
$cron$);
