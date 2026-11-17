// Run with the fixture server and Vite on ports 3011/3012/5176.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {chromium} = require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
const url = 'http://127.0.0.1:5176/docs/acceptance/011-preview/';
const court = 'Quadra em terceira pessoa. Clique para usar o teclado.';
const longName = 'Atleta de teste com um nome deliberadamente muito longo para validar a interface';
// Reach controls with actual Tab presses. No locator.focus(), clicks or DOM activation.
async function tabTo(page, locator) {
  for (let i=0;i<100;i++) {
    if (await locator.evaluate(el=>el===document.activeElement)) return;
    await page.keyboard.press('Tab');
  }
  throw Error('Unreachable by Tab: '+await locator.textContent());
}
async function activate(page, locator) { await locator.waitFor(); await tabTo(page,locator); await page.keyboard.press('Enter'); }
async function type(page, label, value) { await tabTo(page,page.getByLabel(label,{exact:true})); await page.keyboard.type(value); }
async function layout(page, name, checks) {
  const overflow = await page.evaluate(()=>({width:innerWidth,body:document.documentElement.scrollWidth}));
  assert.ok(overflow.body<=overflow.width+1,`${name}: horizontal overflow ${JSON.stringify(overflow)}`);
  checks.push(name);
  const contrast=await page.evaluate(()=>{
    const rgb=value=>{const values=value.match(/[\d.]+/g)?.map(Number);return values?.length>=3?values:null;};
    const luminance=values=>values.slice(0,3).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0);
    const results=[];
    for(const element of document.querySelectorAll('body *')) {
      if(![...element.childNodes].some(n=>n.nodeType===3&&n.textContent.trim())||!element.getClientRects().length||element.closest(':disabled,[aria-hidden="true"]'))continue;
      const style=getComputedStyle(element),foreground=rgb(style.color);if(!foreground)continue;
      let backgrounds=[];
      for(let parent=element;parent;parent=parent.parentElement) {
        const s=getComputedStyle(parent);
        // These UI gradients are opaque: compare both endpoints conservatively.
        const stops=s.backgroundImage.match(/rgba?\([^)]*\)|#[0-9a-f]{6}/gi);
        if(stops){backgrounds=stops.filter(c=>c.startsWith('rgb')).map(rgb).filter(c=>c&&(c.length===3||c[3]===1));if(backgrounds.length)break;}
        const bg=rgb(s.backgroundColor);if(bg&&(bg.length===3||bg[3]===1)){backgrounds=[bg];break;}
      }
      if(!backgrounds.length)continue;
      const ratio=Math.min(...backgrounds.map(bg=>{const a=luminance(foreground),b=luminance(bg);return(Math.max(a,b)+.05)/(Math.min(a,b)+.05);}));
      results.push({text:element.textContent.trim().slice(0,60),ratio});
    }
    return results.sort((a,b)=>a.ratio-b.ratio);
  });
  assert.ok(contrast.length,`${name}: no text inspected`);
  assert.ok(contrast[0].ratio>=4.5,`${name}: contrast failure ${JSON.stringify(contrast.filter(c=>c.ratio<4.5))}`);
  checks.push({contrast:name,minimum:+contrast[0].ratio.toFixed(2),textNodes:contrast.length});
}
async function journey(browser, mode, zoom=false) {
  console.log(`Starting ${browser.version()} ${mode}, zoom-equivalent=${zoom}`);
  const contexts=[],pages=[],errors=[],checks=[],messages=[];
  try {
    for(let i=0;i<(mode==='1v1'?2:4);i++) {
      // 720 CSS px at DPR 2 exercises the layout of a 1440px display at 200%.
      const context=await browser.newContext({viewport:i===0?{width:zoom?720:1440,height:zoom?550:1100}:{width:640,height:480},deviceScaleFactor:i===0&&zoom?2:1});
      await context.addInitScript(()=>{
        window.__audioGains=[];
        const original=AudioParam.prototype.setValueAtTime;
        AudioParam.prototype.setValueAtTime=function(value,time){window.__audioGains.push(value);return original.call(this,value,time);};
      });
      contexts.push(context);const page=await context.newPage();pages.push(page);
      page.on('pageerror',e=>errors.push(e.message));
      page.on('websocket',socket=>socket.on('framereceived',({payload})=>{try{messages.push({page:i,...JSON.parse(String(payload))});}catch{}}));
      await page.goto(url);await page.getByRole('heading',{name:'Samuel',exact:true}).waitFor();
      assert.equal(await page.getByRole('group',{name:'Escolher atleta em destaque'}).getByRole('button').count(),5);
      await type(page,'Seu apelido','Teclado '+i);
    }
    const owner=pages[0];
    await activate(owner,owner.getByRole('button',{name:longName,exact:true}));
    await layout(owner,'entry-long-name',checks);
    if(mode==='2v2')await activate(owner,owner.getByRole('button',{name:'2v2 · Duplas',exact:true}));
    await activate(owner,owner.getByRole('button',{name:'Criar sala',exact:true}));
    const invite=await owner.getByLabel('Link de convite',{exact:true}).inputValue();
    for(const page of pages.slice(1)) {
      await type(page,'Código da sala',new URL(invite).searchParams.get('room'));
      await activate(page,page.getByRole('button',{name:'Entrar',exact:true}));
      await page.getByLabel('Sala e participantes',{exact:true}).waitFor();
      assert.ok(await page.getByRole('button',{name:'Iniciar partida',exact:true}).isDisabled());
    }
    await layout(owner,'lobby-long-name',checks);
    await owner.screenshot({path:`docs/acceptance/011-${mode}${zoom?'-zoom':''}-lobby.png`,fullPage:true});
    // Confirm character selection in the lobby also works without a pointer.
    await activate(owner,owner.getByRole('button',{name:'Caio',exact:true}));
    for(const page of pages)await activate(page,page.getByRole('button',{name:'Pronto para jogar',exact:true}));
    await activate(owner,owner.getByRole('button',{name:'Iniciar partida',exact:true}));
    await owner.getByLabel('Partida online',{exact:true}).waitFor();
    console.log(`${mode}: lobby and readiness passed`);
    await activate(owner,owner.getByText('Áudio e imagem',{exact:true}));
    const volume=owner.getByRole('slider',{name:'Volume dos sinais sonoros'});
    await tabTo(owner,volume);await owner.keyboard.press('Home');assert.equal(await volume.inputValue(),'0');
    await owner.keyboard.press('End');assert.equal(await volume.inputValue(),'100');
    await activate(owner,owner.getByRole('button',{name:'Qualidade: baixa',exact:true}));
    await owner.getByRole('button',{name:'Qualidade: alta',exact:true}).waitFor();
    await activate(owner,owner.getByRole('button',{name:'Qualidade: alta',exact:true}));
    const stable=owner.getByRole('checkbox',{name:/Câmera estável/});await tabTo(owner,stable);await owner.keyboard.press('Space');assert.ok(await stable.isChecked());
    await layout(owner,'match-options',checks);
    const serve=owner.getByRole('button',{name:'Sacar · L',exact:true});
    await owner.waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Sacar · L'&&!b.disabled));
    await tabTo(owner,owner.getByLabel(court,{exact:true}));
    await owner.keyboard.press('l');await owner.getByText('Em jogo',{exact:true}).waitFor();
    console.log(`${mode}: serve accepted`);
    await owner.waitForFunction(()=>window.__audioGains.includes(.08),{},{timeout:30000});
    await tabTo(owner,volume);await owner.keyboard.press('Home');
    const beforeMute=await owner.evaluate(()=>({signals:window.__audioGains.length,score:document.querySelector('[aria-label="Placar"]').textContent}));
    await owner.waitForFunction(score=>document.querySelector('[aria-label="Placar"]').textContent!==score,beforeMute.score,{timeout:30000});
    await owner.waitForTimeout(100);
    assert.equal(await owner.evaluate(()=>window.__audioGains.length),beforeMute.signals,'muted point generated an oscillator gain');
    // Let authoritative serving timeouts finish naturally; no score injection.
    console.log(`${mode}: keyboard serve and audio passed; waiting for six points`);
    await owner.getByLabel('Resultado da partida',{exact:true}).waitFor({timeout:150000});
    const result=messages.findLast(m=>m.page===0&&m.type==='matchEnded');assert.ok(result);
    assert.equal(result.payload.reason,'points');assert.equal(Math.max(result.payload.score.A,result.payload.score.B),6);
    await layout(owner,'result',checks);
    await owner.screenshot({path:`docs/acceptance/011-${mode}${zoom?'-zoom':''}-result.png`,fullPage:true});
    for(const page of pages)await activate(page,page.getByRole('button',{name:'Quero revanche',exact:true}));
    await owner.waitForFunction(()=>!document.querySelector('[aria-label="Resultado da partida"]'));
    const next=messages.findLast(m=>m.page===0&&m.type==='snapshot');assert.ok(next);assert.notEqual(next.payload.matchId,result.payload.matchId);assert.deepEqual(next.payload.score,{A:0,B:0});
    await layout(owner,'rematch',checks);
    assert.equal(errors.length,0,errors.join('\n'));
    return {mode,layout:zoom?'720 CSS px / DPR 2 (200% equivalent)':'1440 CSS px / DPR 1',keyboard:true,checks,audioGraph:{gainAt100:.08,mutedPointSilent:true,physicalOutputVerified:false},result:result.payload.score,rematch:true,errors};
  } catch(error) {
    console.error('Last server state',JSON.stringify(messages.findLast(m=>m.page===0&&m.type==='snapshot')));
    if(pages[0])await pages[0].screenshot({path:'.test-build/011-journey-failure.png',fullPage:true}).catch(()=>{});
    throw error;
  } finally {for(const context of contexts)await context.close();}
}
async function fallback(browser) {
  const context=await browser.newContext(),peer=await browser.newContext();
  try {
    await context.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:original.call(this,kind,...args);};});
    const page=await context.newPage(),other=await peer.newPage();
    await page.goto(url);await page.getByText('Modelo 3D indisponível.',{exact:false}).waitFor();
    await type(page,'Seu apelido','Sem WebGL');await activate(page,page.getByRole('button',{name:'Criar sala',exact:true}));
    const invite=await page.getByLabel('Link de convite',{exact:true}).inputValue();
    await other.goto(url);await type(other,'Seu apelido','Parceiro');await type(other,'Código da sala',new URL(invite).searchParams.get('room'));await activate(other,other.getByRole('button',{name:'Entrar',exact:true}));
    for(const p of [page,other])await activate(p,p.getByRole('button',{name:'Pronto para jogar',exact:true}));
    await activate(page,page.getByRole('button',{name:'Iniciar partida',exact:true}));
    await page.getByText('Modo gráfico indisponível',{exact:true}).waitFor();
    assert.ok(await page.getByRole('group',{name:'Ações da partida'}).getByRole('button').evaluateAll(buttons=>buttons.every(b=>b.disabled)));
    await page.screenshot({path:'docs/acceptance/011-webgl-fallback.png',fullPage:true});
    await activate(page,page.getByRole('button',{name:'Abandonar partida',exact:true}));
    return {preview:true,match:true,actionsDisabled:true,keyboardExit:true};
  } finally {await context.close();await peer.close();}
}
(async()=>{
  const report={date:new Date().toISOString(),platform:process.platform,browsers:[]};
  for(const [name,executablePath] of [['Chrome','C:/Program Files/Google/Chrome/Application/chrome.exe'],['Edge','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe']]) {
    const browser=await chromium.launch({executablePath,headless:true});
    try {
      const result={name,version:browser.version(),journeys:[]};
      // Sequential modes keep the real-time fixture load representative.
      result.journeys.push(await journey(browser,'1v1'));
      fs.writeFileSync('docs/acceptance/011-journey-results.json',JSON.stringify({...report,inProgress:{name,version:result.version,journeys:result.journeys}},null,2)+'\n');
      result.journeys.push(await journey(browser,'2v2',true));
      result.webgl=await fallback(browser);report.browsers.push(result);
      console.log(JSON.stringify(result));
    } finally {await browser.close();}
  }
  fs.writeFileSync('docs/acceptance/011-journey-results.json',JSON.stringify(report,null,2)+'\n');
})().catch(error=>{console.error(error);process.exitCode=1;});
