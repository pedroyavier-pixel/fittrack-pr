-- FitTrack PR — esquema inicial. Ejecutar una vez mediante SQL Editor o como migración.
-- Todos los datos son privados. No requiere claves secretas en el navegador.
begin;

create or replace function public.fittrack_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.created_at := old.created_at;
  new.updated_at := clock_timestamp();
  return new;
end;
$$;
revoke all on function public.fittrack_touch_updated_at() from public, anon;
grant execute on function public.fittrack_touch_updated_at() to authenticated;

do $$
declare
  suffix text;
  date_required boolean;
begin
  foreach suffix in array array[
    'user_profiles','user_goals','exercise_catalog','food_catalog','workout_plans',
    'workout_plan_exercises','workout_sessions','workout_sets','cardio_logs',
    'recipes','recipe_ingredients','meal_plans','meal_plan_items','food_logs','body_measurements'
  ] loop
    date_required := suffix = any(array['workout_sessions','workout_sets','cardio_logs','food_logs','body_measurements']);
    execute format(
      'create table public.%I (
        id uuid primary key default gen_random_uuid(),
        user_id uuid not null references auth.users(id) on delete cascade,
        data jsonb not null default ''{}''::jsonb check (jsonb_typeof(data) = ''object''),
        local_date date %s,
        created_at timestamptz not null default now(),
        updated_at timestamptz not null default now(),
        deleted_at timestamptz,
        unique(id,user_id)
      )',
      'fittrack_' || suffix,
      case when date_required then 'not null default ((now() at time zone ''America/Puerto_Rico'')::date)' else '' end
    );
    execute format('alter table public.%I enable row level security', 'fittrack_' || suffix);
    execute format('revoke all on public.%I from anon', 'fittrack_' || suffix);
    execute format('grant select, insert, update, delete on public.%I to authenticated', 'fittrack_' || suffix);
    execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', 'fittrack_' || suffix);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', 'fittrack_' || suffix);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', 'fittrack_' || suffix);
    execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', 'fittrack_' || suffix);
    execute format('create index %I on public.%I (user_id,updated_at,id)', 'fittrack_' || suffix || '_sync_idx', 'fittrack_' || suffix);
    if date_required then
      execute format('create index %I on public.%I (user_id,local_date) where deleted_at is null', 'fittrack_' || suffix || '_date_idx', 'fittrack_' || suffix);
    end if;
    execute format('create trigger touch_updated_at before update on public.%I for each row execute function public.fittrack_touch_updated_at()', 'fittrack_' || suffix);
    -- Tombstones are UPDATEs, so no REPLICA IDENTITY FULL / deleted payload is required.
    if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
      execute format('alter publication supabase_realtime add table public.%I', 'fittrack_' || suffix);
    end if;
  end loop;
end;
$$;

alter table public.fittrack_user_profiles add constraint fittrack_one_profile_per_user unique(user_id);
alter table public.fittrack_workout_plan_exercises
  add column plan_id uuid,
  add column exercise_id uuid,
  add constraint fittrack_plan_exercise_owner_fk foreign key(plan_id,user_id) references public.fittrack_workout_plans(id,user_id),
  add constraint fittrack_plan_catalog_owner_fk foreign key(exercise_id,user_id) references public.fittrack_exercise_catalog(id,user_id);
alter table public.fittrack_workout_sessions
  add column plan_id uuid,
  add constraint fittrack_session_plan_owner_fk foreign key(plan_id,user_id) references public.fittrack_workout_plans(id,user_id);
alter table public.fittrack_workout_sets
  add column session_id uuid,
  add column exercise_id uuid,
  add constraint fittrack_set_session_owner_fk foreign key(session_id,user_id) references public.fittrack_workout_sessions(id,user_id),
  add constraint fittrack_set_catalog_owner_fk foreign key(exercise_id,user_id) references public.fittrack_exercise_catalog(id,user_id);
alter table public.fittrack_cardio_logs
  add column session_id uuid,
  add constraint fittrack_cardio_session_owner_fk foreign key(session_id,user_id) references public.fittrack_workout_sessions(id,user_id);
alter table public.fittrack_recipe_ingredients
  add column recipe_id uuid,
  add column food_id uuid,
  add constraint fittrack_ingredient_recipe_owner_fk foreign key(recipe_id,user_id) references public.fittrack_recipes(id,user_id),
  add constraint fittrack_ingredient_food_owner_fk foreign key(food_id,user_id) references public.fittrack_food_catalog(id,user_id);
alter table public.fittrack_meal_plan_items
  add column meal_plan_id uuid,
  add column food_id uuid,
  add column recipe_id uuid,
  add constraint fittrack_meal_item_plan_owner_fk foreign key(meal_plan_id,user_id) references public.fittrack_meal_plans(id,user_id),
  add constraint fittrack_meal_item_food_owner_fk foreign key(food_id,user_id) references public.fittrack_food_catalog(id,user_id),
  add constraint fittrack_meal_item_recipe_owner_fk foreign key(recipe_id,user_id) references public.fittrack_recipes(id,user_id);
alter table public.fittrack_food_logs
  add column food_id uuid,
  add column recipe_id uuid,
  add constraint fittrack_food_log_catalog_owner_fk foreign key(food_id,user_id) references public.fittrack_food_catalog(id,user_id),
  add constraint fittrack_food_log_recipe_owner_fk foreign key(recipe_id,user_id) references public.fittrack_recipes(id,user_id);

-- Index every foreign key to keep deletes/joins predictable as history grows.
create index fittrack_plan_exercise_parent_idx on public.fittrack_workout_plan_exercises(plan_id,user_id);
create index fittrack_plan_exercise_catalog_idx on public.fittrack_workout_plan_exercises(exercise_id,user_id);
create index fittrack_session_plan_idx on public.fittrack_workout_sessions(plan_id,user_id);
create index fittrack_set_session_idx on public.fittrack_workout_sets(session_id,user_id);
create index fittrack_set_catalog_idx on public.fittrack_workout_sets(exercise_id,user_id);
create index fittrack_cardio_session_idx on public.fittrack_cardio_logs(session_id,user_id);
create index fittrack_ingredient_recipe_idx on public.fittrack_recipe_ingredients(recipe_id,user_id);
create index fittrack_ingredient_food_idx on public.fittrack_recipe_ingredients(food_id,user_id);
create index fittrack_meal_item_plan_idx on public.fittrack_meal_plan_items(meal_plan_id,user_id);
create index fittrack_meal_item_food_idx on public.fittrack_meal_plan_items(food_id,user_id);
create index fittrack_meal_item_recipe_idx on public.fittrack_meal_plan_items(recipe_id,user_id);
create index fittrack_food_log_catalog_idx on public.fittrack_food_logs(food_id,user_id);
create index fittrack_food_log_recipe_idx on public.fittrack_food_logs(recipe_id,user_id);

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('fittrack-progress','fittrack-progress',false,10485760,array['image/jpeg','image/png','image/webp','image/heic','image/heif'])
on conflict(id) do nothing;

create policy fittrack_photo_select on storage.objects for select to authenticated
using (bucket_id = 'fittrack-progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy fittrack_photo_insert on storage.objects for insert to authenticated
with check (bucket_id = 'fittrack-progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy fittrack_photo_update on storage.objects for update to authenticated
using (bucket_id = 'fittrack-progress' and (storage.foldername(name))[1] = (select auth.uid())::text)
with check (bucket_id = 'fittrack-progress' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy fittrack_photo_delete on storage.objects for delete to authenticated
using (bucket_id = 'fittrack-progress' and (storage.foldername(name))[1] = (select auth.uid())::text);

notify pgrst, 'reload schema';
commit;
