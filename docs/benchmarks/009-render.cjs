const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
const fs=require('node:fs'),os=require('node:os');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5176/docs/art/009-review.html?manual=1');
 await page.waitForFunction(()=>typeof window.reviewAt==='function');
 await page.evaluate(async()=>{document.body.innerHTML='<div id="bench" style="width:1280px;height:720px"></div>';document.body.style.cssText='margin:0;padding:0';const {createScene}=await import('/apps/web/src/scene/createScene.ts');const {syntheticSnapshot}=await import('/apps/web/src/game/presentation.ts');window.adapter=createScene(document.querySelector('#bench'));window.adapter.setQuality('low');window.sample=syntheticSnapshot;});
 const result=await page.evaluate(()=>new Promise(resolve=>{const samples=[];const start=performance.now();let previous=start,hidden=document.hidden;function step(now){
  const seconds=(now-start)/1000,tick=seconds*60,cycle=Math.floor(seconds/2);
  const frame=window.sample(seconds);frame.matchId='benchmark';frame.renderTick=tick;
  frame.athletes=frame.athletes.map((a,i)=>({...a,assetKey:i%2?'procedural:v1:male:2016838844':'procedural:v1:male:2626328580',position:{...a.position,y:Math.max(0,Math.sin(seconds*Math.PI+i)*.7)}}));
  frame.visualActions=frame.athletes.map((a,i)=>({id:cycle*4+i+1,actorId:a.id,kind:['serve','receive','set','attack','block','rant','freePoint'][(cycle+i)%7],tick:cycle*120,facing:a.team==='A'?0:Math.PI}));
  window.adapter.update(frame);hidden||=document.hidden;samples.push(now-previous);previous=now;
  if(now-start>=300000){samples.sort((a,b)=>a-b);resolve({durationMs:now-start,frames:samples.length,p95Ms:samples[Math.ceil(samples.length*.95)-1],maxMs:samples.at(-1),hidden});}else requestAnimationFrame(step);
 }requestAnimationFrame(step);}));
 const gpu=await page.evaluate(()=>{const gl=document.querySelector('canvas').getContext('webgl2'),ext=gl.getExtension('WEBGL_debug_renderer_info');return ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);});
 const baseline=JSON.parse(fs.readFileSync('docs/art/008-candidate.json','utf8'));
 await page.screenshot({path:'docs/art/009-court.png'});
 const report={timestamp:new Date().toISOString(),browser:await browser.version(),cpu:os.cpus()[0].model,os:os.version(),gpu,width:1280,height:720,dpr:1,quality:'low',scenario:'four athletic avatars with locomotion, jumps and seven confirmed gestures; Vite/headless; synthetic snapshots',...result,errors,baselineP95Ms:baseline.p95Ms,regressionPercent:(result.p95Ms/baseline.p95Ms-1)*100,pass:!result.hidden&&result.p95Ms<=33.3&&result.p95Ms<=baseline.p95Ms*1.1&&errors.length===0};
 fs.writeFileSync('docs/benchmarks/009-render.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
