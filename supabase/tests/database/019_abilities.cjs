const assert = require("node:assert/strict");
const { readFileSync, readdirSync } = require("node:fs");
const { resolve } = require("node:path");
const { PGlite } = require(resolve(".test-build/sql/node_modules/@electric-sql/pglite"));

async function run() {
  const db = new PGlite();
  try {
    await db.exec(`create schema auth;
      create schema extensions;
      create role anon;
      create role authenticated;
      create role service_role bypassrls;
      create table auth.users(id uuid primary key);
      grant usage on schema auth to authenticated;
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      create function auth.jwt() returns jsonb language sql stable as
        $$ select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb $$;`);
    for (const file of readdirSync("supabase/migrations").sort()) {
      await db.exec(readFileSync("supabase/migrations/" + file, "utf8")
        .replace("create extension if not exists pgcrypto with schema extensions;", ""));
      if (file === "202611160003_initial_roster.sql") {
        // Simulate a clean roster where only Samuel has an existing revision.
        await db.exec("delete from characters where id='caio'");
      }
    }
    const uid = "00000000-0000-4000-8000-000000000019";
    const flags = isAnonymous => `set request.jwt.claims='{"is_anonymous":${isAnonymous}}'`;
    const before = (await db.query("select * from characters where id='samuel'")).rows[0];
    assert.equal((await db.query("select * from characters where ability_id='free_point_out'")).rows.length, 0);
    await db.query("insert into auth.users values ($1)", [uid]);
    await db.exec(`set role authenticated; set request.jwt.claim.sub='${uid}'; ${flags(false)}`);
    const payload = {
      name: "Publicação inicial de teste",
      abilityId: "free_point_out",
      assetKey: "procedural:athletic-v2:female:19",
      attributes: { serve: 50, receive: 50, set: 50, attack: 50, block: 50, speed: 50, jump: 50 },
    };
    const write = (action, revision, value = payload) => db.query(
      "select roster_write($1, $2, $3, $4::jsonb) as result",
      [action, "first-ability", revision, JSON.stringify(value)],
    );
    const list = () => db.query("select * from roster_abilities order by id");
    assert.equal((await list()).rows.length, 0);
    await assert.rejects(write("save", 0), error => error.code === "42501");
    await db.exec(`reset role; insert into roster_admins (user_id) values ('${uid}'); set role authenticated; ${flags(true)}`);
    assert.equal((await list()).rows.length, 0);
    await assert.rejects(write("save", 0), error => error.code === "42501");
    await db.exec(flags(false));
    const enabled = (await list()).rows.filter(row => row.enabled);
    assert.deepEqual(enabled.map(row => row.id), ["free_point_out", "teammate_rant"]);
    assert.ok(!(await list()).rows.some(row => row.id === "speed_boost_fixture"));
    assert.deepEqual(enabled[1].ability_config, before.ability_config);
    await assert.rejects(db.exec("update roster_abilities set enabled=false"), error => error.code === "42501");
    await assert.rejects(write("save", 0, { ...payload, abilityId: "speed_boost_fixture" }),
      error => error.message === "ability_unavailable");
    await assert.rejects(write("save", 0, { ...payload, abilityConfig: {} }), error => error.code === "22023");
    assert.deepEqual((await write("save", 0)).rows[0].result.payload, payload);

    await db.exec("reset role; update roster_abilities set enabled=false where id='free_point_out'; set role authenticated");
    await assert.rejects(write("publish", 1), error => error.message === "ability_unavailable");
    assert.equal((await db.query("select revision from character_drafts where id='first-ability'")).rows[0].revision, 1);
    await db.exec("reset role; update roster_abilities set enabled=true where id='free_point_out'; set role authenticated");
    await write("publish", 1);
    const revision = (await db.query("select version, ability_id, ability_config from characters where id='first-ability'")).rows[0];
    assert.deepEqual(revision, { version: 1, ability_id: "free_point_out", ability_config: enabled[0].ability_config });
    await db.exec("reset role; update roster_abilities set enabled=false where id='free_point_out'");
    assert.deepEqual((await db.query("select version, ability_id, ability_config from characters where id='first-ability'")).rows[0], revision);
    assert.deepEqual((await db.query("select * from characters where id='samuel'")).rows[0], before);
    console.log("019 catálogo: primeira publicação sem atleta prévio, RLS, autorização, revalidação e revisões imutáveis");
  } finally {
    await db.close();
  }
}

run().catch(error => { console.error(error); process.exitCode = 1; });
