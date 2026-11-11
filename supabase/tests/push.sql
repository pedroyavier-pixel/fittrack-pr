-- Transactional fixtures: no accounts or records survive this test.
begin;
select set_config('fittrack.push_a',gen_random_uuid()::text,true);
select set_config('fittrack.push_b',gen_random_uuid()::text,true);
insert into auth.users(id,aud,role,email) values
(current_setting('fittrack.push_a')::uuid,'authenticated','authenticated','push-a-'||current_setting('fittrack.push_a')||'@example.invalid'),
(current_setting('fittrack.push_b')::uuid,'authenticated','authenticated','push-b-'||current_setting('fittrack.push_b')||'@example.invalid');
insert into public.fittrack_push_subscriptions(user_id,endpoint) values
(current_setting('fittrack.push_a')::uuid,'https://web.push.apple.com/QATEST-A-'||current_setting('fittrack.push_a')),
(current_setting('fittrack.push_b')::uuid,'https://web.push.apple.com/QATEST-B-'||current_setting('fittrack.push_b'));
do $$ declare n int; begin
 select count(*) into n from public.fittrack_claim_push('2030-01-07T17:00:00-04:00'); if n<>2 then raise exception 'Monday 17: expected 2, got %',n; end if;
 select count(*) into n from public.fittrack_claim_push('2030-01-07T17:00:00-04:00'); if n<>0 then raise exception 'Duplicate claims';end if;
 select count(*) into n from public.fittrack_claim_push('2030-01-07T20:00:00-04:00'); if n<>2 then raise exception 'Monday 20';end if;
 select count(*) into n from public.fittrack_claim_push('2030-01-09T17:00:00-04:00'); if n<>0 then raise exception 'Wednesday should be quiet';end if;
 select count(*) into n from public.fittrack_claim_push('2030-01-13T17:00:00-04:00'); if n<>0 then raise exception 'Sunday should be quiet';end if;
end $$;
insert into public.fittrack_workout_sessions(user_id,local_date,data) values(current_setting('fittrack.push_a')::uuid,'2030-01-08','{"startedAt":"2030-01-08T18:00:00Z"}');
insert into public.fittrack_workout_sets(user_id,local_date,data) values(current_setting('fittrack.push_a')::uuid,'2030-01-08','{"completed":false}');
do $$ declare n int;begin
 select count(*) into n from public.fittrack_claim_push('2030-01-08T17:00:00-04:00');if n<>2 then raise exception 'Empty/incomplete must not suppress';end if;
end $$;
update public.fittrack_workout_sets set data='{"completed":true}' where user_id=current_setting('fittrack.push_a')::uuid;
do $$ declare n int;begin
 select count(*) into n from public.fittrack_claim_push('2030-01-08T20:00:00-04:00');if n<>1 then raise exception 'Completed set must suppress 20:00';end if;
end $$;
insert into public.fittrack_cardio_logs(user_id,local_date,data) values(current_setting('fittrack.push_a')::uuid,'2030-01-10','{"minutes":20}');
insert into public.fittrack_workout_sessions(user_id,local_date,data) values(current_setting('fittrack.push_a')::uuid,'2030-01-11','{"endedAt":"2030-01-11T18:00:00Z"}');
do $$ declare n int;begin
 select count(*) into n from public.fittrack_claim_push('2030-01-10T17:00:00-04:00');if n<>1 then raise exception 'Cardio must suppress';end if;
 select count(*) into n from public.fittrack_claim_push('2030-01-11T17:00:00-04:00');if n<>1 then raise exception 'Finished session must suppress';end if;
end $$;
insert into public.fittrack_workout_plans(user_id,data) values(current_setting('fittrack.push_a')::uuid,'{"day":1,"type":"rest"}');
do $$ declare n int;begin
 select count(*) into n from public.fittrack_claim_push('2030-01-14T17:00:00-04:00');if n<>1 then raise exception 'Custom rest day must suppress';end if;
end $$;
set local role authenticated;
select set_config('request.jwt.claim.sub',current_setting('fittrack.push_a'),true);
do $$ declare n int;begin
 select count(*) into n from public.fittrack_push_subscriptions;if n<>1 then raise exception 'Subscription isolation failed';end if;
 begin perform * from public.fittrack_push_config;raise exception 'Secrets readable';exception when insufficient_privilege then null;end;
 begin perform * from public.fittrack_claim_push();raise exception 'Scheduler callable by user';exception when insufficient_privilege then null;end;
 begin insert into public.fittrack_push_subscriptions(user_id,endpoint) values(current_setting('fittrack.push_b')::uuid,'https://web.push.apple.com/not-authorized');raise exception 'Cross-owner insert allowed';exception when insufficient_privilege then null;end;
end $$;
reset role;
rollback;
select 'PASS: Puerto Rico times, no duplicates, activity suppression, custom plans and RLS' as result;
