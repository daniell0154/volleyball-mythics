const {PGlite}=require(require('node:path').resolve('.test-build/sql/node_modules/@electric-sql/pglite'));
const {readFileSync,readdirSync}=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{const db=new PGlite();try{
 await db.exec(`create schema auth; create schema extensions; create role anon; create role authenticated; create role service_role bypassrls;
 create table auth.users(id uuid primary key); grant usage on schema auth to authenticated;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claims',true),''),'{}')::jsonb$$;`);
 for(const file of readdirSync('supabase/migrations').sort())await db.exec(readFileSync('supabase/migrations/'+file,'utf8').replace('create extension if not exists pgcrypto with schema extensions;',''));
 const id='00000000-0000-4000-8000-000000000012';
 await db.query('insert into auth.users values($1)',[id]);
 await db.query('insert into roster_admins(user_id) values($1)',[id]);
 await db.exec(`set role authenticated; set request.jwt.claim.sub='${id}'; set request.jwt.claims='{"is_anonymous":true}'`);
 assert.equal((await db.query('select is_roster_admin() as ok')).rows[0].ok,false);
 await assert.rejects(db.query('insert into roster_admins(user_id) values($1)',[id]),e=>e.code==='42501');
 assert.equal((await db.query('select * from character_drafts')).rows.length,0);
 await db.exec(`set request.jwt.claims='{"is_anonymous":false}'`);
 assert.equal((await db.query('select is_roster_admin() as ok')).rows[0].ok,true);
 await assert.rejects(db.query(`update characters set name='changed' where id='samuel'`),e=>e.code==='42501');
 await db.exec('reset role');
 await assert.rejects(db.query(`update characters set name='changed' where id='samuel'`),e=>e.code==='23514');
 await db.exec('set role authenticated');
 const payload={name:'Fixture admin somente teste',attributes:{serve:70,receive:71,set:72,attack:73,block:74,speed:75,jump:76},abilityId:'free_point_out',assetKey:'procedural:athletic-v2:female:12'};
 const write=(action,expected,body=payload)=>db.query('select roster_write($1,$2,$3,$4::jsonb) as result',[action,'fixture-admin',expected,JSON.stringify(body)]);
 for(const bad of [{...payload,name:''},{...payload,abilityId:'unknown'},{...payload,assetKey:'https://evil.test/a'},{...payload,attributes:{...payload.attributes,jump:101}},{...payload,attributes:{...payload.attributes,jump:2.5}},{...payload,abilityConfig:{}}])await assert.rejects(write('save',0,bad),e=>e.code==='22023');
 assert.equal((await db.query('select count(*)::int as n from roster_audit')).rows[0].n,0);
 await write('save',0);
 assert.equal((await db.query("select count(*)::int as n from characters where id='fixture-admin'")).rows[0].n,0);
 const concurrent=await Promise.allSettled([write('publish',1),write('publish',1)]);
 assert.equal(concurrent.filter(r=>r.status==='fulfilled').length,1);
 assert.equal(concurrent.filter(r=>r.status==='rejected'&&r.reason.code==='40001').length,1);
 assert.equal((await db.query("select overall from characters where id='fixture-admin'")).rows[0].overall,73);
 await write('save',2,{...payload,name:'Segunda revisão'});await write('publish',3);
 assert.deepEqual((await db.query("select version,name,enabled from characters where id='fixture-admin' order by version")).rows,[{version:1,name:payload.name,enabled:false},{version:2,name:'Segunda revisão',enabled:true}]);
 await write('disable',4);
 assert.equal((await db.query("select count(*)::int as n from characters where id='fixture-admin' and enabled")).rows[0].n,0);
 assert.equal((await db.query("select count(*)::int as n from roster_audit where character_id='fixture-admin'")).rows[0].n,5);
 const visualWrite=(action,expected,assetKey)=>db.query('select roster_write($1,$2,$3,$4::jsonb) as result',
  [action,'visual-fixture',expected,assetKey===undefined?null:JSON.stringify({...payload,assetKey})]);
 for(const invalid of ['procedural:v1:female:4294967296','procedural:visual-v3:classic:male:4294967296:warm:short',
  'procedural:visual-v3:unknown:male:12:warm:short','procedural:visual-v3:classic:male:12:unknown:short',
  'procedural:visual-v3:classic:male:12:warm:unknown','procedural:visual-v3:classic:male:12:warm:short\n',12]){
  await assert.rejects(visualWrite('save',0,invalid),e=>e.code==='22023');
 }
 const legacy='procedural:v1:female:0000000012', current='procedural:visual-v3:classic:female:12:deep:swept-long';
 assert.equal((await visualWrite('save',0,legacy)).rows[0].result.payload.assetKey,legacy);
 await visualWrite('publish',1);
 assert.equal((await visualWrite('save',2,current)).rows[0].result.payload.assetKey,current);
 await visualWrite('publish',3);
 assert.deepEqual((await db.query("select version,asset_key,enabled from characters where id='visual-fixture' order by version")).rows,[
  {version:1,asset_key:legacy,enabled:false},{version:2,asset_key:current,enabled:true},
 ]);
 await db.exec(`set request.jwt.claims='{"is_anonymous":true}'`);
 await assert.rejects(write('save',5),e=>e.code==='42501');
 await db.exec(`set request.jwt.claims='{"is_anonymous":false}'; reset role; delete from roster_admins; set role authenticated`);
 await assert.rejects(write('save',5),e=>e.code==='42501');
 console.log('012/018 passed: RLS, validated payloads, optimistic revisions, audit, revocation and legacy/visual-v3 round trips');
}finally{await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
