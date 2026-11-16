-- Run against a clean local Supabase database after supabase db reset.
begin;

insert into auth.users(id) values
  ('10000000-0000-4000-8000-000000000001'),
  ('10000000-0000-4000-8000-000000000002');

insert into public.characters (
  id, version, name, serve, receive, set_skill, attack, block, speed, jump,
  ability_id, asset_key
) values (
  'test-character', 1, 'Temporary test fixture', 70, 70, 70, 70, 70, 70, 70,
  'test-ability', 'fixtures/test.glb'
);

insert into public.profiles(user_id, display_name) values
  ('10000000-0000-4000-8000-000000000001', 'Player One'),
  ('10000000-0000-4000-8000-000000000002', 'Player Two');

set local role authenticated;
select set_config('request.jwt.claim.sub', '10000000-0000-4000-8000-000000000001', true);
do $$
begin
  if (select count(*) from public.profiles) <> 1 then
    raise exception 'RLS exposed another user profile';
  end if;
  if (select count(*) from public.characters where enabled) <> 1 then
    raise exception 'authenticated guest could not read enabled character';
  end if;
end;
$$;
reset role;

do $$
declare
  result_payload jsonb := jsonb_build_object(
    'matchId', '20000000-0000-4000-8000-000000000001',
    'mode', '1v1', 'score', jsonb_build_object('A', 6, 'B', 4),
    'winner', 'A', 'reason', 'points', 'rulesVersion', 1,
    'startedAt', '2026-11-16T00:00:00Z', 'endedAt', '2026-11-16T00:05:00Z',
    'players', jsonb_build_array(
      jsonb_build_object('userId', '10000000-0000-4000-8000-000000000001', 'team', 'A', 'slot', 0, 'characterId', 'test-character', 'characterVersion', 1),
      jsonb_build_object('userId', '10000000-0000-4000-8000-000000000002', 'team', 'B', 'slot', 0, 'characterId', 'test-character', 'characterVersion', 1)
    )
  );
  changed_payload jsonb;
begin
  perform public.persist_match_result(result_payload);
  perform public.persist_match_result(result_payload);
  if (select count(*) from public.matches where id = '20000000-0000-4000-8000-000000000001') <> 1 then
    raise exception 'idempotent retry inserted duplicate match';
  end if;
  if (select count(*) from public.match_players where match_id = '20000000-0000-4000-8000-000000000001') <> 2 then
    raise exception 'retry inserted duplicate players';
  end if;

  changed_payload := jsonb_set(result_payload, '{score,B}', '5'::jsonb);
  begin
    perform public.persist_match_result(changed_payload);
    raise exception 'conflicting retry unexpectedly succeeded';
  exception when unique_violation then
    null;
  end;
end;
$$;

rollback;
