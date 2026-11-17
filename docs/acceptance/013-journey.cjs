const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
const {writeFileSync,readdirSync}=require('node:fs');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const errors=[],pages=[],messages=[],base='http://127.0.0.1:5178/docs/acceptance/013-preview/';
 const production=await browser.newPage();production.on('pageerror',e=>errors.push(e.message));
 for(const route of ['/','/demo','/preview']){await production.goto('http://127.0.0.1:3016'+route);await production.getByText('2v2 online · Dois jogadores por equipe.',{exact:false}).waitFor();assert.equal(await production.getByRole('button',{name:/demonstração|1v1|bot/i}).count(),0);}
 await production.goto('http://127.0.0.1:3016/admin');await production.getByRole('heading',{name:'Admin do elenco',exact:true}).waitFor();await production.close();
 assert.equal(readdirSync('apps/web/dist/assets').some(n=>/^(Demo|Game)-/.test(n)),false);
 for(let i=0;i<4;i++){const context=await browser.newContext({viewport:{width:i===0?1440:640,height:i===0?1100:480}}),page=await context.newPage();pages.push(page);page.on('pageerror',e=>errors.push(e.message));page.on('websocket',s=>s.on('framereceived',({payload})=>{try{messages.push({page:i,...JSON.parse(String(payload))});}catch{}}));await page.goto(base);await page.getByRole('heading',{name:'Samuel',exact:true}).waitFor();await page.waitForSelector('canvas');assert.equal(await page.locator('canvas').count(),1);await page.getByLabel('Seu apelido',{exact:true}).fill('Dupla '+i);}
 const owner=pages[0];await owner.screenshot({path:'docs/acceptance/013-entry.png',fullPage:true});
 await owner.getByRole('button',{name:'Criar sala',exact:true}).click();const invite=await owner.getByLabel('Link de convite',{exact:true}).inputValue();
 assert.ok(await owner.getByRole('button',{name:'Iniciar partida',exact:true}).isDisabled());
 for(const page of pages.slice(1)){await page.getByLabel('Código da sala',{exact:true}).fill(new URL(invite).searchParams.get('room'));await page.getByRole('button',{name:'Entrar',exact:true}).click();await page.getByLabel('Sala e participantes',{exact:true}).waitFor();assert.ok(await page.getByRole('button',{name:'Iniciar partida',exact:true}).isDisabled());}
 for(const page of pages)await page.getByRole('button',{name:'Pronto para jogar',exact:true}).click();
 await owner.getByRole('button',{name:'Iniciar partida',exact:true}).waitFor({state:'visible'});await owner.screenshot({path:'docs/acceptance/013-lobby.png',fullPage:true});
 await owner.getByRole('button',{name:'Iniciar partida',exact:true}).click();await owner.getByLabel('Partida online',{exact:true}).waitFor();
 await owner.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Sacar · L'&&!b.disabled));
 await owner.getByLabel('Quadra em terceira pessoa. Clique para usar o teclado.',{exact:true}).focus();await owner.keyboard.press('l');await owner.getByText('Em jogo',{exact:true}).waitFor();
 await owner.screenshot({path:'docs/acceptance/013-match.png',fullPage:true});console.log('2v2: four sessions served; waiting for authoritative six points');
 await owner.getByLabel('Resultado da partida',{exact:true}).waitFor({timeout:150000});const result=messages.findLast(m=>m.page===0&&m.type==='matchEnded');assert.equal(result.payload.reason,'points');assert.equal(Math.max(result.payload.score.A,result.payload.score.B),6);
 for(let i=0;i<3;i++)await pages[i].getByRole('button',{name:'Quero revanche',exact:true}).click();assert.ok(await owner.getByLabel('Resultado da partida',{exact:true}).isVisible());
 await pages[3].getByRole('button',{name:'Quero revanche',exact:true}).click();await owner.waitForFunction(()=>!document.querySelector('[aria-label="Resultado da partida"]'));const next=messages.findLast(m=>m.page===0&&m.type==='snapshot');assert.notEqual(next.payload.matchId,result.payload.matchId);assert.deepEqual(next.payload.score,{A:0,B:0});
 // Explicit abandonment after rematch must keep real score, not manufacture six.
 await pages[3].getByRole('button',{name:'Abandonar partida',exact:true}).click();await owner.getByLabel('Resultado da partida',{exact:true}).waitFor();const forfeit=messages.findLast(m=>m.page===0&&m.type==='matchEnded');assert.equal(forfeit.payload.reason,'forfeit');assert.deepEqual(forfeit.payload.score,{A:0,B:0});
 assert.equal(errors.length,0,errors.join('\n'));const protocolErrors=messages.filter(m=>m.type==='error').map(m=>m.payload.code);
 assert.equal(protocolErrors.filter(c=>c!=='invalid_state').length,0,JSON.stringify(protocolErrors));
 const report={date:new Date().toISOString(),browser:browser.version(),auth:'local fixture; production UI built, real sockets/runtime',sessions:4,preview:true,removedDemo:true,productionRoutes:['/','/demo','/preview','/admin'],result:result.payload.score,rematch:true,forfeit:forfeit.payload.score,protocolErrors,jsErrors:errors};writeFileSync('docs/acceptance/013-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
