begin;
alter table public.matches add column match_kind text not null default 'humans' check(match_kind in ('humans','vsBots')),
 add column bot_difficulty text, add column bot_policy_version integer, add column bot_seed bigint;
alter table public.matches add constraint bot_metadata check(
 (match_kind='humans' and bot_difficulty is null and bot_policy_version is null and bot_seed is null)
 or (match_kind='vsBots' and bot_difficulty in ('easy','normal','hard') and bot_difficulty is not null
 and bot_policy_version=1 and bot_policy_version is not null and bot_seed between 0 and 4294967295 and bot_seed is not null));
create table public.match_participants(
 match_id uuid not null references public.matches(id) on delete cascade,
 participant_id text not null check(length(participant_id)<=80),
 controller text not null check(controller in ('human','bot')),
 user_id uuid references auth.users(id),team public.team_side not null,slot smallint not null check(slot in(0,1)),
 character_id text not null,character_version integer not null,
 primary key(match_id,participant_id),unique(match_id,team,slot),unique(match_id,user_id),
 foreign key(character_id,character_version) references public.characters(id,version),
 check((controller='human' and user_id is not null and participant_id=user_id::text)
 or(controller='bot' and user_id is null and participant_id ~ '^bot:[0-9a-f-]{36}$'))
);
alter table public.match_participants enable row level security;
revoke all on public.match_participants from anon,authenticated;
grant select on public.match_participants to authenticated;
grant all on public.match_participants to service_role;
create policy own_match_participants on public.match_participants for select to authenticated using(
 exists(select 1 from public.match_players p where p.match_id=match_participants.match_id and p.user_id=auth.uid()));

create function public.persist_bot_match_result(p_result jsonb) returns uuid language plpgsql security definer set search_path='' as $$
declare v_id uuid:=(p_result->>'matchId')::uuid;v_hash text:=md5(p_result::text);v_saved uuid;
 v_winner public.team_side:=(p_result->>'winner')::public.team_side;v_reason public.match_reason:=(p_result->>'reason')::public.match_reason;
 v_humans integer;v_count integer;v_a integer;v_b integer;
begin
 if jsonb_typeof(p_result) is distinct from 'object' or jsonb_typeof(p_result->'players') is distinct from 'array'
 or p_result->>'mode' is distinct from '2v2' or p_result->>'matchKind' is distinct from 'vsBots'
 or coalesce(p_result->>'difficulty','') not in ('easy','normal','hard')
 or coalesce((p_result->>'botPolicyVersion')::integer,0)<>1
 or p_result->>'botSeed' is null or (p_result->>'botSeed')::numeric<>trunc((p_result->>'botSeed')::numeric)
 or (p_result->>'botSeed')::numeric not between 0 and 4294967295 then raise exception 'invalid_bot_result' using errcode='22023';end if;
 select count(*),count(*)filter(where p.team='A'),count(*)filter(where p.team='B'),count(*)filter(where p.controller='human')
 into v_count,v_a,v_b,v_humans from jsonb_to_recordset(p_result->'players')as p(team text,controller text);
 if v_count<>4 or v_a<>2 or v_b<>2 or v_humans not in(1,2)
 or(select count(distinct p->>'participantId') from jsonb_array_elements(p_result->'players')p)<>4
 or(select count(distinct concat(p->>'team',':',p->>'slot')) from jsonb_array_elements(p_result->'players')p)<>4
 or p_result->>'startedAt' is null or p_result->>'endedAt' is null
 or exists(select 1 from jsonb_to_recordset(p_result->'players')as p(team text,controller text) where p.controller='human' and p.team<>'A')
 or (v_winner is null and v_reason is distinct from 'server_failure') or(v_winner is not null and (v_reason is null or v_reason='server_failure'))
 or(v_reason='points' and not((v_winner='A' and (p_result#>>'{score,A}')::integer=6 and (p_result#>>'{score,B}')::integer<6)
 or(v_winner='B' and (p_result#>>'{score,B}')::integer=6 and (p_result#>>'{score,A}')::integer<6))) then raise exception 'invalid_bot_participants' using errcode='22023';end if;
 insert into public.matches(id,mode,status,score_a,score_b,winner,reason,rules_version,result_hash,started_at,ended_at,match_kind,bot_difficulty,bot_policy_version,bot_seed)
 values(v_id,'2v2',case when v_winner is null then 'cancelled'::public.match_status else 'finished'::public.match_status end,
 (p_result#>>'{score,A}')::smallint,(p_result#>>'{score,B}')::smallint,v_winner,v_reason,(p_result->>'rulesVersion')::integer,v_hash,
 (p_result->>'startedAt')::timestamptz,(p_result->>'endedAt')::timestamptz,'vsBots',p_result->>'difficulty',1,(p_result->>'botSeed')::bigint)
 on conflict(id)do update set id=excluded.id where public.matches.result_hash=excluded.result_hash returning id into v_saved;
 if v_saved is null then raise exception 'result_conflict' using errcode='23505';end if;
 insert into public.match_participants(match_id,participant_id,controller,user_id,team,slot,character_id,character_version)
 select v_id,p."participantId",p.controller,p."userId",p.team,p.slot,p."characterId",p."characterVersion"
 from jsonb_to_recordset(p_result->'players')as p("participantId" text,controller text,"userId" uuid,team public.team_side,slot smallint,"characterId" text,"characterVersion" integer)
 on conflict(match_id,participant_id)do nothing;
 insert into public.match_players(match_id,user_id,team,slot,character_id,character_version)
 select v_id,p."userId",p.team,p.slot,p."characterId",p."characterVersion"
 from jsonb_to_recordset(p_result->'players')as p("userId" uuid,controller text,team public.team_side,slot smallint,"characterId" text,"characterVersion" integer)
 where p.controller='human' on conflict(match_id,user_id)do nothing;
 return v_id;
end $$;
revoke all on function public.persist_bot_match_result(jsonb) from public,anon,authenticated;
grant execute on function public.persist_bot_match_result(jsonb) to service_role;
commit;
