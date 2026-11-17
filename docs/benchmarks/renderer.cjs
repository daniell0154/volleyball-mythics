const { chromium } = require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
const fs = require('node:fs'); const os = require('node:os');
(async () => {
 const browser=await chromium.launch({executablePath:'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',headless:true});
 const page=await browser.newPage({viewport:{width:1400,height:1000},deviceScaleFactor:1});
 const errors=[]; page.on('pageerror',e=>errors.push(e.message));
 await page.goto(process.argv[2] || 'http://127.0.0.1:5174/'); await page.waitForSelector('canvas');
 await page.evaluate(async()=>{
  const {KeyboardInput,attachKeyboard}=await import('/src/input/keyboard.ts');
  const k=new KeyboardInput(); const target=document.querySelector('[tabindex="0"]');
  window.testKeyboard=k; window.detachTestKeyboard=attachKeyboard(target,k);target.focus();
 });
 await page.keyboard.down('w'); await page.keyboard.down('d');
 let sample=await page.evaluate(()=>window.testKeyboard.sample('rally'));
 if(Math.abs(Math.hypot(sample.moveX,sample.moveZ)-1)>1e-10) throw Error('movement failed');
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));
 sample=await page.evaluate(()=>window.testKeyboard.sample('rally'));
 if(sample.moveX||sample.moveZ||sample.actions.length)throw Error('blur failed');
 await page.keyboard.up('w');await page.keyboard.up('d');
 for(const [key,phase,action] of [['Space','rally','jump'],['j','rally','receive'],['k','rally','set'],['l','serving','serve'],['l','rally','attack'],['u','rally','ability']]){
  await page.keyboard.press(key); const s=await page.evaluate(p=>window.testKeyboard.sample(p),phase);
  if(!s.actions.includes(action))throw Error('action failed '+action);
 }
 await page.evaluate(()=>window.detachTestKeyboard());
 const recreate=page.getByRole('button',{name:'Recriar cena'});
 for(let i=0;i<10;i++){await recreate.click();await page.waitForTimeout(100);}
 if(await page.locator('canvas').count()!==1)throw Error('canvas leak');
 const metadata=await page.evaluate(()=>{
  const gl=document.querySelector('canvas').getContext('webgl2');const ext=gl.getExtension('WEBGL_debug_renderer_info');
  return {userAgent:navigator.userAgent,gpu:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER)};
 });
 console.log(JSON.stringify({stage:'browser-input-and-recreation-passed',...metadata}));
 await page.evaluate(()=>{const host=document.querySelector('canvas').parentElement;host.style.width='1280px';host.style.height='720px';host.style.minHeight='720px';});
 await page.waitForTimeout(3000);
 const size=await page.locator('canvas').evaluate(c=>({width:c.width,height:c.height}));
 if(size.width!==1280||size.height!==720)throw Error('wrong size '+JSON.stringify(size));
 console.log('Starting 300-second renderer sample');
 const result=await page.evaluate(()=>new Promise(resolve=>{
  const samples=[];const start=performance.now();let previous=start;let hidden=document.hidden;
  const step=now=>{hidden=hidden||document.hidden;samples.push(now-previous);previous=now;
   if(now-start>=300000){samples.sort((a,b)=>a-b);resolve({durationMs:now-start,frames:samples.length,p95Ms:samples[Math.ceil(samples.length*0.95)-1],maxMs:samples.at(-1),averageMs:samples.reduce((a,b)=>a+b,0)/samples.length,hidden});}
   else requestAnimationFrame(step);
  };requestAnimationFrame(step);
 }));
 const report={timestamp:new Date().toISOString(),cpu:os.cpus()[0]?.model,ramGiB:os.totalmem()/1024**3,os:os.version(),browser:await browser.version(),mode:'headless, default GPU, deviceScaleFactor=1, low quality, Vite dev',...metadata,...size,...result,errors,pass:!result.hidden&&result.p95Ms<=33.3&&errors.length===0};
 fs.writeFileSync('.test-build/renderer-report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await page.screenshot({path:'.test-build/renderer.png'});await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});

