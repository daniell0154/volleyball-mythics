-- Cancelled matches have no winner; keep the existing finished-result RPC intact.
create or replace function public.persist_cancelled_match_result(p_result jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_id uuid := (p_result ->> 'matchId')::uuid;
  v_mode public.match_mode := (p_result ->> 'mode')::public.match_mode;
  v_started timestamptz := (p_result ->> 'startedAt')::timestamptz;
  v_ended timestamptz := (p_result ->> 'endedAt')::timestamptz;
  v_hash text := md5(p_result::text);
  v_saved uuid;
  v_count integer; v_a integer; v_b integer;
begin
  if jsonb_typeof(p_result) <> 'object' or jsonb_typeof(p_result -> 'players') <> 'array'
    or p_result ->> 'status' is distinct from 'cancelled'
    or p_result ->> 'reason' is distinct from 'server_failure'
    or p_result ->> 'winner' is not null or v_started is null or v_ended is null or v_ended < v_started then
    raise exception 'invalid_cancelled_result' using errcode = '22023';
  end if;
  select count(*), count(*) filter (where p.team = 'A'), count(*) filter (where p.team = 'B')
    into v_count,v_a,v_b from jsonb_to_recordset(p_result -> 'players') as p(team text);
  if not ((v_mode = '1v1' and v_count = 2 and v_a = 1 and v_b = 1)
    or (v_mode = '2v2' and v_count = 4 and v_a = 2 and v_b = 2)) then
    raise exception 'invalid_player_count' using errcode = '22023';
  end if;
  insert into public.matches(id,mode,status,score_a,score_b,winner,reason,rules_version,result_hash,started_at,ended_at)
    values(v_id,v_mode,'cancelled',(p_result #>> '{score,A}')::smallint,(p_result #>> '{score,B}')::smallint,
      null,'server_failure',(p_result ->> 'rulesVersion')::integer,v_hash,v_started,v_ended)
    on conflict(id) do update set id = excluded.id where public.matches.result_hash = excluded.result_hash
    returning id into v_saved;
  if v_saved is null then raise exception 'result_conflict' using errcode = '23505'; end if;
  insert into public.match_players(match_id,user_id,team,slot,character_id,character_version)
    select v_id,p."userId",p.team,p.slot,p."characterId",p."characterVersion"
    from jsonb_to_recordset(p_result -> 'players') as p("userId" uuid,team public.team_side,slot smallint,"characterId" text,"characterVersion" integer)
    on conflict(match_id,user_id) do nothing;
  return v_id;
end;
$$;
revoke all on function public.persist_cancelled_match_result(jsonb) from public,anon,authenticated;
grant execute on function public.persist_cancelled_match_result(jsonb) to service_role;
