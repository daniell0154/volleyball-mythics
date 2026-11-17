const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const errors=[];const reports=[];
 for(const mode of ['1v1','2v2']){
  const contexts=[],pages=[];
  for(let i=0;i<(mode==='1v1'?2:4);i++){
   const context=await browser.newContext({viewport:{width:1280,height:1000}}),page=await context.newPage();
   contexts.push(context);pages.push(page);page.on('pageerror',e=>{errors.push(e.message);console.log('pageerror: '+e.message);});
   await page.goto('http://127.0.0.1:5176/docs/benchmarks/playtest/');
   await page.getByText('Conectado',{exact:false}).first().waitFor();
  }
  await pages[0].getByRole('button',{name:'Criar '+mode,exact:true}).click();
  await pages[0].waitForFunction(()=>document.body.innerText.includes('Sala '));
  if(!await pages[0].getByRole('button',{name:'Iniciar partida',exact:true}).isDisabled())throw Error('incomplete room can start');
  const text=await pages[0].locator('body').innerText(),code=/Sala ([A-Z0-9]+)/.exec(text)[1];
  for(const page of pages.slice(1)){await page.getByLabel('Código da sala').fill(code);await page.getByRole('button',{name:'Entrar',exact:true}).click();}
  for(const page of pages)await page.getByRole('button',{name:'Escolher Caio',exact:true}).click();
  await pages[0].waitForFunction(count=>(document.body.innerText.match(/caio/g)??[]).length===count,pages.length);
  for(const page of pages)await page.getByRole('button',{name:'Pronto',exact:true}).click();
  await pages[0].waitForFunction(()=>!document.body.innerText.includes('não pronto'));
  await pages[0].getByRole('button',{name:'Iniciar partida',exact:true}).click();
  await pages[0].getByRole('button',{name:'Sacar · L',exact:true}).click();
  await pages[0].waitForFunction(()=>document.body.innerText.includes('Rallies coletados: 1/40'));
  await pages[0].waitForFunction(()=>{const score=document.querySelector('[aria-label="Placar"]');return score&&score.textContent!=='0 × 0';});
  const score=await pages[0].getByLabel('Placar',{exact:true}).innerText();
  reports.push({mode,score,measuredRallies:1});
  if(mode==='1v1')await pages[0].screenshot({path:'docs/benchmarks/010-playtest.png',fullPage:true});
  for(const context of contexts)await context.close();
 }
 console.log(JSON.stringify({reports,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
