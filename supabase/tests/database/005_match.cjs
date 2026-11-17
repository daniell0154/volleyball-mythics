// Isolated PostgreSQL/WASM verification; no cloud credentials or data are used.
// npm install --prefix .test-build/sql --no-package-lock @electric-sql/pglite
// node supabase/tests/database/005_match.cjs (from repository root)
const { PGlite } = require(require('node:path').resolve('.test-build/sql/node_modules/@electric-sql/pglite'));
const { readFileSync } = require('node:fs');
const { randomUUID } = require('node:crypto');
const assert = require('node:assert/strict');
(async () => {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth; create schema extensions; create role anon; create role authenticated; create role service_role bypassrls;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;`);
    // pgcrypto is a hosted-environment dependency already covered by 001/cloud.
    // This test uses built-in UUID generation and validates the new RPC unchanged.
    const initial = readFileSync('supabase/migrations/202611160001_initial_schema.sql', 'utf8').replace('create extension if not exists pgcrypto with schema extensions;', '');
    await db.exec(initial);
    for (const file of ['202611160002_persist_match_result.sql','202611160003_initial_roster.sql','202611160004_persist_cancelled_result.sql']) await db.exec(readFileSync('supabase/migrations/' + file, 'utf8'));
    const users = [randomUUID(), randomUUID()];
    for (const id of users) await db.query('insert into auth.users(id) values($1)', [id]);
    const payload = { matchId: randomUUID(), mode: '1v1', status: 'cancelled', score: { A: 2, B: 3 }, winner: null, reason: 'server_failure', rulesVersion: 1,
      startedAt: '2026-11-16T00:00:00Z', endedAt: '2026-11-16T00:01:00Z', players: users.map((userId,i)=>({ userId, team: i ? 'B' : 'A', slot: 0, characterId: i ? 'caio' : 'samuel', characterVersion: 1 })) };
    const invoke = value => db.query('select public.persist_cancelled_match_result($1::jsonb)', [JSON.stringify(value)]);
    await db.exec('set role service_role');
    await invoke(payload); await invoke(payload);
    const saved = await db.query('select status,winner,score_a,score_b from public.matches where id=$1', [payload.matchId]);
    assert.deepEqual(saved.rows[0], { status: 'cancelled', winner: null, score_a: 2, score_b: 3 });
    assert.equal((await db.query('select count(*)::int as n from public.match_players where match_id=$1',[payload.matchId])).rows[0].n, 2);
    await assert.rejects(invoke({...payload,score:{A:3,B:3}}), e=>e.code==='23505');
    await assert.rejects(invoke({...payload,matchId:randomUUID(),winner:'A'}), e=>e.code==='22023');
    const rollbackId=randomUUID();
    await assert.rejects(invoke({...payload,matchId:rollbackId,players:[payload.players[0],{...payload.players[1],characterId:'missing-character'}]}), e=>e.code==='23503');
    assert.equal((await db.query('select count(*)::int as n from public.matches where id=$1',[rollbackId])).rows[0].n, 0);
    const finished={...payload,matchId:randomUUID(),status:'finished',score:{A:6,B:3},winner:'A',reason:'points'};
    await db.query('select public.persist_match_result($1::jsonb)',[JSON.stringify(finished)]);
    for (const role of ['authenticated','anon']) {
      await db.exec(`reset role; set role ${role}`);
      await assert.rejects(invoke({...payload,matchId:randomUUID()}), e=>e.code==='42501');
    }
    await db.exec('reset role');
    const roster=(await db.query('select id,overall from public.characters order by id')).rows;
    assert.deepEqual(roster,[{id:'caio',overall:77},{id:'samuel',overall:85}]);
    console.log(JSON.stringify({cancelledResult:'passed',idempotency:'passed',conflict:'passed',nullWinner:'passed',transactionRollback:'passed',finishedRpcRegression:'passed',permissions:'passed',roster}));
  } finally { await db.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
