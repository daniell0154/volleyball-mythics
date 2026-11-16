create or replace function public.persist_match_result(p_result jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid := (p_result ->> 'matchId')::uuid;
  v_mode public.match_mode := (p_result ->> 'mode')::public.match_mode;
  v_score_a smallint := (p_result #>> '{score,A}')::smallint;
  v_score_b smallint := (p_result #>> '{score,B}')::smallint;
  v_winner public.team_side := (p_result ->> 'winner')::public.team_side;
  v_reason public.match_reason := (p_result ->> 'reason')::public.match_reason;
  v_rules_version integer := (p_result ->> 'rulesVersion')::integer;
  v_started_at timestamptz := (p_result ->> 'startedAt')::timestamptz;
  v_ended_at timestamptz := (p_result ->> 'endedAt')::timestamptz;
  v_hash text := md5(p_result::text);
  v_saved_id uuid;
  v_player_count integer;
  v_team_a_count integer;
  v_team_b_count integer;
begin
  if jsonb_typeof(p_result) <> 'object' or jsonb_typeof(p_result -> 'players') <> 'array' then
    raise exception 'invalid_result_payload' using errcode = '22023';
  end if;

  select count(*), count(*) filter (where player.team = 'A'), count(*) filter (where player.team = 'B')
    into v_player_count, v_team_a_count, v_team_b_count
  from jsonb_to_recordset(p_result -> 'players') as player(
    "userId" uuid, team public.team_side, slot smallint,
    "characterId" text, "characterVersion" integer
  );

  if (v_mode = '1v1' and (v_player_count <> 2 or v_team_a_count <> 1 or v_team_b_count <> 1))
     or (v_mode = '2v2' and (v_player_count <> 4 or v_team_a_count <> 2 or v_team_b_count <> 2)) then
    raise exception 'invalid_player_count' using errcode = '22023';
  end if;
  if v_winner is null or v_reason is null or v_rules_version < 1 or v_ended_at < v_started_at then
    raise exception 'invalid_result_fields' using errcode = '22023';
  end if;
  if v_reason = 'points' and not ((v_winner = 'A' and v_score_a = 6) or (v_winner = 'B' and v_score_b = 6)) then
    raise exception 'invalid_points_winner' using errcode = '22023';
  end if;

  insert into public.matches (
    id, mode, status, score_a, score_b, winner, reason, rules_version,
    result_hash, started_at, ended_at
  ) values (
    v_id, v_mode, 'finished', v_score_a, v_score_b, v_winner, v_reason,
    v_rules_version, v_hash, v_started_at, v_ended_at
  ) on conflict (id) do update set id = excluded.id
    where public.matches.result_hash = excluded.result_hash
  returning id into v_saved_id;

  if v_saved_id is null then
    raise exception 'result_conflict' using errcode = '23505';
  end if;

  insert into public.match_players(match_id, user_id, team, slot, character_id, character_version)
  select v_id, player."userId", player.team, player.slot, player."characterId", player."characterVersion"
  from jsonb_to_recordset(p_result -> 'players') as player(
    "userId" uuid, team public.team_side, slot smallint,
    "characterId" text, "characterVersion" integer
  )
  on conflict (match_id, user_id) do nothing;

  return v_id;
end;
$$;

revoke all on function public.persist_match_result(jsonb) from public, anon, authenticated;
grant execute on function public.persist_match_result(jsonb) to service_role;
