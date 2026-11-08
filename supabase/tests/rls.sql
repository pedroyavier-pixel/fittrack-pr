-- Run as postgres in SQL Editor. All fixture accounts and records are rolled back.
-- Any failed assertion raises an exception; success returns the final PASS row.
begin;
select set_config('fittrack.test_a',gen_random_uuid()::text,true);
select set_config('fittrack.test_b',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,email)
values
  (current_setting('fittrack.test_a')::uuid,'authenticated','authenticated','fittrack-rls-a-' || current_setting('fittrack.test_a') || '@example.invalid'),
  (current_setting('fittrack.test_b')::uuid,'authenticated','authenticated','fittrack-rls-b-' || current_setting('fittrack.test_b') || '@example.invalid');

do $$
declare t text; fixture_id uuid;
begin
  for t in select tablename from pg_tables where schemaname='public' and tablename like 'fittrack\_%' escape '\' loop
    execute format('insert into public.%I(user_id,data) values ($1,$2) returning id',t)
      into fixture_id using current_setting('fittrack.test_b')::uuid, '{"fixture":"B"}'::jsonb;
    if t='fittrack_workout_sessions' then
      perform set_config('fittrack.test_b_session',fixture_id::text,true);
    end if;
  end loop;
end;
$$;

set local role authenticated;
select set_config('request.jwt.claims',json_build_object('sub',current_setting('fittrack.test_a'),'role','authenticated')::text,true);

do $$
declare t text; visible_rows integer; affected integer; own_id uuid; old_created timestamptz;
begin
  if auth.uid() <> current_setting('fittrack.test_a')::uuid then raise exception 'JWT fixture failed'; end if;
  for t in select tablename from pg_tables where schemaname='public' and tablename like 'fittrack\_%' escape '\' loop
    execute format('select count(*) from public.%I',t) into visible_rows;
    if visible_rows <> 0 then raise exception '%: B records leaked',t; end if;

    execute format('insert into public.%I(user_id,data) values ($1,$2) returning id,created_at',t)
      into own_id,old_created using auth.uid(),'{"fixture":"A"}'::jsonb;
    execute format('select count(*) from public.%I',t) into visible_rows;
    if visible_rows <> 1 then raise exception '%: own record not readable',t; end if;

    begin
      execute format('insert into public.%I(user_id,data) values ($1,$2)',t)
        using current_setting('fittrack.test_b')::uuid,'{}'::jsonb;
      raise exception '%: cross-user insert was allowed',t;
    exception when insufficient_privilege then null;
    end;

    execute format('update public.%I set data=$1 where user_id=$2',t)
      using '{"unauthorized":true}'::jsonb,current_setting('fittrack.test_b')::uuid;
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception '%: cross-user update was allowed',t; end if;

    execute format('delete from public.%I where user_id=$1',t)
      using current_setting('fittrack.test_b')::uuid;
    get diagnostics affected = row_count;
    if affected <> 0 then raise exception '%: cross-user delete was allowed',t; end if;

    begin
      execute format('update public.%I set user_id=$1 where id=$2',t)
        using current_setting('fittrack.test_b')::uuid,own_id;
      raise exception '%: ownership transfer was allowed',t;
    exception when insufficient_privilege then null;
    end;

    execute format('update public.%I set data=$1,deleted_at=clock_timestamp(),created_at=''2000-01-01'' where id=$2',t)
      using '{"fixture":"A","edited":true}'::jsonb,own_id;
    get diagnostics affected = row_count;
    if affected <> 1 then raise exception '%: own update failed',t; end if;
    execute format('select count(*) from public.%I where id=$1 and deleted_at is not null and created_at=$2 and updated_at>=created_at',t)
      into visible_rows using own_id,old_created;
    if visible_rows <> 1 then raise exception '%: tombstone/timestamps failed',t; end if;
  end loop;

  begin
    insert into public.fittrack_workout_sets(user_id,session_id,data)
    values(auth.uid(),current_setting('fittrack.test_b_session')::uuid,'{}');
    raise exception 'Cross-user parent relationship was allowed';
  exception when foreign_key_violation then null;
  end;
end;
$$;

-- Account B sees its original rows, including after A attempted update/delete.
select set_config('request.jwt.claims',json_build_object('sub',current_setting('fittrack.test_b'),'role','authenticated')::text,true);
do $$
declare t text; visible_rows integer;
begin
  for t in select tablename from pg_tables where schemaname='public' and tablename like 'fittrack\_%' escape '\' loop
    execute format('select count(*) from public.%I where data->>''fixture''=''B''',t) into visible_rows;
    if visible_rows <> 1 then raise exception '%: B row was damaged or inaccessible',t; end if;
  end loop;
end;
$$;

reset role;
rollback;
select 'PASS: 15 tables; own CRUD, cross-account read/write/delete/transfer blocked; parent ownership; timestamps; tombstones; rollback' as result;
