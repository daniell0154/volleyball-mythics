// Local PostgreSQL + actual runtime + browser presentation. Fixture auth only.
const {PGlite}=require(require('node:path').resolve('.test-build/sql/node_modules/@electric-sql/pglite'));
const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
const {readFileSync,readdirSync,writeFileSync}=require('node:fs');
const {pathToFileURL}=require('node:url');const path=require('node:path');
const {createServer}=require('node:http');const assert=require('node:assert/strict');
const {candidates,createAbilityReview}=require('./019-review-fixture.cjs');
const moduleAt=p=>import(pathToFileURL(path.resolve(p)).href);
async function readInput(req){let body='';for await(const chunk of req)body+=chunk;return JSON.parse(body);}
(async()=>{const db=new PGlite();let browser,http,transport,ticker;try{
 await db.exec(`create schema auth; create schema extensions; create role anon; create role authenticated; create role service_role bypassrls;create table auth.users(id uuid primary key);grant usage on schema auth to authenticated;
 create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
 create function auth.jwt() returns jsonb language sql stable as $$select '{"is_anonymous":false}'::jsonb$$;`);
 for(const f of readdirSync('supabase/migrations').sort())await db.exec(readFileSync('supabase/migrations/'+f,'utf8').replace('create extension if not exists pgcrypto with schema extensions;',''));
 const admin='00000000-0000-4000-8000-000000000012';await db.exec(`insert into auth.users values('${admin}');insert into roster_admins(user_id) values('${admin}');set role authenticated;set request.jwt.claim.sub='${admin}';`);
 const catalog=async()=>(await db.query('select * from characters where enabled order by id')).rows.map(c=>({id:c.id,version:c.version,name:c.name,overall:c.overall,assetKey:c.asset_key,attributes:{serve:c.serve,receive:c.receive,set:c.set_skill,attack:c.attack,block:c.block,speed:c.speed,jump:c.jump},abilityId:c.ability_id,abilityConfig:c.ability_config}));
 const {RoomApplication}=await moduleAt('apps/server/dist/rooms/application.js');const {MatchRuntime}=await moduleAt('apps/server/dist/runtime/matches.js');const {createTransport}=await moduleAt('apps/server/dist/network/server.js');
 const selected=(id,v)=>app.catalog.find(c=>c.id===id&&c.version===v);
 const runtime=new MatchRuntime((r,s)=>app.broadcast(r,'snapshot',s),Date.now,(id,v)=>selected(id,v)?.assetKey,(id,v)=>selected(id,v)?.attributes,
  (id,v)=>{const entry=selected(id,v);return entry?.abilityId&&entry.abilityConfig?{id:entry.abilityId,config:entry.abilityConfig}:undefined;},false);
 const app=new RoomApplication(await catalog(),{start:r=>runtime.start(r),input:(r,id,p)=>runtime.submit(r,id,p)});
 const review=process.argv.includes('--ability-review')?
  createAbilityReview(db,app,runtime,(await import('@volleyball-mythics/domain')).createBallContactState):null;
 if(review)for(const id of candidates)await review.setAvailability(id,true);
 runtime.onAction=(id,message)=>{review?.onAction(id,message);app.sendTo(id,'actionFeedback',{message});};
 transport=createTransport({origins:['http://127.0.0.1:5177'],verify:async token=>({userId:token,expiresAt:Date.now()+3600000}),onConnect:s=>app.connect(s),onDisconnect:s=>app.disconnect(s),onCommand:(s,m)=>app.command(s,m)});
 await new Promise(resolve=>transport.http.listen(3015,'127.0.0.1',resolve));
 let previous=performance.now();ticker=setInterval(()=>{const now=performance.now();review?.beforeAdvance();runtime.advance(Math.min(now-previous,100));previous=now;},5);
 let queue=Promise.resolve();
 http=createServer((req,res)=>{queue=queue.then(async()=>{res.setHeader('Access-Control-Allow-Origin','http://127.0.0.1:5177');res.setHeader('Content-Type','application/json');try{
  let result;
  if(req.url==='/catalog')result=await catalog();
  else if(req.url==='/list'){const drafts=(await db.query('select id,revision,payload from character_drafts order by id')).rows;const published=(await db.query('select * from characters order by id,version desc')).rows.map(c=>({id:c.id,version:c.version,name:c.name,enabled:c.enabled,payload:{name:c.name,attributes:{serve:c.serve,receive:c.receive,set:c.set_skill,attack:c.attack,block:c.block,speed:c.speed,jump:c.jump},assetKey:c.asset_key,abilityId:c.ability_id}}));const abilities=(await db.query('select id,enabled,ability_config from roster_abilities order by id')).rows;result={drafts,published,abilities};}
  else if(req.url==='/write'){const p=await readInput(req);result=(await db.query('select roster_write($1,$2,$3,$4::jsonb) as value',[p.action,p.id,p.expected,JSON.stringify(p.payload??null)])).rows[0].value;app.refreshCatalog(await catalog());}
  else if(review&&req.url==='/ability-availability'&&req.method==='POST'){const p=await readInput(req);result=await review.setAvailability(p.id,p.enabled);}
  else if(review&&req.url==='/ability-state'&&req.method==='POST'){result=review.state((await readInput(req)).room);}
  else if(review&&req.url==='/ability-ball'&&req.method==='POST'){result=review.placeBall(await readInput(req));}
  else throw Error('unknown fixture route');
  res.end(JSON.stringify(result));
 }catch(e){res.statusCode=400;res.end(JSON.stringify({code:e.code,message:e.message}));}});});
 await new Promise(resolve=>http.listen(3014,'127.0.0.1',resolve));
 if(process.argv.includes('--serve')){console.log('012 fixture review: http://127.0.0.1:5177/docs/acceptance/012-preview/ (fictional email/password; no production authentication)');await new Promise(resolve=>process.once('SIGINT',resolve));return;}
 browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});const context=await browser.newContext({viewport:{width:1440,height:1100}});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());
 const base='http://127.0.0.1:5177/docs/acceptance/012-preview/';await page.goto(base);await page.getByLabel('Email',{exact:true}).fill('admin@example.test');await page.getByLabel('Senha',{exact:true}).fill('fixture-only');await page.getByRole('button',{name:'Entrar no admin',exact:true}).click();
 await page.getByRole('button',{name:'Novo personagem',exact:true}).click();await page.getByLabel('Nome',{exact:true}).fill('Atleta de aceite local');await page.getByLabel('Modelo',{exact:true}).selectOption('female');await page.getByLabel('Variação visual',{exact:true}).fill('1234');await page.getByLabel('Saque',{exact:true}).fill('90');
 await page.getByRole('button',{name:'Salvar rascunho',exact:true}).click();await page.getByText('Rascunho salvo.',{exact:false}).waitFor();assert.equal((await catalog()).length,2);
 await page.getByRole('button',{name:'Publicar revisão',exact:true}).click();await page.getByText('Nova revisão publicada.',{exact:false}).waitFor();const published=(await catalog()).find(c=>c.name==='Atleta de aceite local');assert.ok(published);assert.equal(published.overall,56);
 await page.waitForSelector('canvas');await page.screenshot({path:'docs/acceptance/012-admin.png',fullPage:true});
 const games=[];for(let i=0;i<2;i++){const c=await browser.newContext({viewport:{width:1280,height:900}}),p=await c.newPage();games.push(p);p.on('pageerror',e=>errors.push(e.message));await p.goto(base+'?game');await p.getByLabel('Seu apelido',{exact:true}).fill('Aceite '+i);await p.getByRole('button',{name:'Atleta de aceite local',exact:true}).click();}
 await games[0].getByRole('button',{name:'Criar sala',exact:true}).click();const invite=await games[0].getByLabel('Link de convite',{exact:true}).inputValue();await games[1].getByLabel('Código da sala',{exact:true}).fill(new URL(invite).searchParams.get('room'));await games[1].getByRole('button',{name:'Entrar',exact:true}).click();for(const p of games)await p.getByRole('button',{name:'Pronto para jogar',exact:true}).click();await games[0].getByRole('button',{name:'Iniciar partida',exact:true}).click();await games[0].getByLabel('Partida online',{exact:true}).waitFor();
 const room=app.rooms.all()[0],match=runtime.get(room.roomId);assert.equal(match.athletes[0].attributes.serve,90);assert.equal(match.athletes[0].assetKey,published.assetKey);
 await page.getByLabel('Saque',{exact:true}).fill('10');await page.getByRole('button',{name:'Salvar rascunho',exact:true}).click();await page.getByText('Rascunho salvo.',{exact:false}).waitFor();await page.getByRole('button',{name:'Publicar revisão',exact:true}).click();await page.getByText('Nova revisão publicada.',{exact:false}).waitFor();
 await page.getByRole('button',{name:'Desativar personagem',exact:true}).click();await page.getByText('Personagem desativado.',{exact:false}).waitFor();assert.equal((await catalog()).some(c=>c.id===published.id),false);assert.equal(match.athletes[0].attributes.serve,90);assert.equal(match.athletes[0].assetKey,published.assetKey);assert.equal(room.members[0].character.version,1);
 await games[0].screenshot({path:'docs/acceptance/012-match.png',fullPage:true});assert.equal(errors.length,0,errors.join('\n'));
 const report={date:new Date().toISOString(),browser:browser.version(),sql:'PGlite, real migrations/RPC',auth:'fixture only, not remote Supabase',createdPublishedPlayed:true,revisedDisabled:true,activeMatchPinned:true,errors};writeFileSync('docs/acceptance/012-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{clearInterval(ticker);if(browser)await browser.close();if(http)await new Promise(r=>http.close(r));if(transport)await transport.close();await db.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
