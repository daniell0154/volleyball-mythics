const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));const fs=require('node:fs');const assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const rows=[],errors=[];for(const side of ['A','B'])for(const quality of ['low','high'])for(const stable of [0,1])for(const [width,height]of [[1280,720],[1920,1080],[640,360]]){
 const page=await browser.newPage({viewport:{width,height},deviceScaleFactor:width===640?2:1});page.on('pageerror',e=>errors.push(e.message));await page.route('**/@vite/client',r=>r.fulfill({body:'',contentType:'application/javascript'}));await page.goto(`http://127.0.0.1:5178/docs/benchmarks/014-review.html?profile=4&side=${side}&quality=${quality}&stable=${stable}`);await page.waitForFunction(()=>typeof window.reviewAt==='function');
 for(const [kind,ball]of [['net',{x:0,y:2,z:0}],['high',{x:4,y:12,z:8}],['outside',{x:100,y:20,z:0}]]){
  const cue=await page.evaluate(ball=>{window.manual=true;window.adapter.update({...window.trace[0],ball});const cue=document.querySelector('[data-ball-cue]'),r=cue.getBoundingClientRect();return{width:r.width,height:r.height,x:r.x,y:r.y,arrow:cue.textContent,title:cue.title};},ball);
  assert.ok(cue.width>=12&&cue.height>=12);assert.ok(cue.x>=0&&cue.y>=0&&cue.x+cue.width<=width&&cue.y+cue.height<=height);if(kind==='outside')assert.ok(cue.arrow);
  rows.push({side,quality,stable,width,height,probe:kind,cue});
 }
 if(width===1280&&quality==='low'&&stable===1){await page.evaluate(()=>{window.manual=false;});await page.waitForTimeout(100);await page.screenshot({path:`docs/benchmarks/014-ball-${side}.png`});
 const base64=await page.evaluate(()=>new Promise(resolve=>{const canvas=document.querySelector('canvas'),recorder=new MediaRecorder(canvas.captureStream(30),{mimeType:'video/webm'}),parts=[];recorder.ondataavailable=e=>parts.push(e.data);recorder.onstop=async()=>{const bytes=new Uint8Array(await new Blob(parts).arrayBuffer());let s='';for(const b of bytes)s+=String.fromCharCode(b);resolve(btoa(s));};recorder.start();setTimeout(()=>recorder.stop(),8000);}));fs.writeFileSync(`docs/benchmarks/014-candidate-${side}.webm`,Buffer.from(base64,'base64'));}
 await page.close();
 }
 assert.equal(errors.length,0,errors.join('\n'));const report={date:new Date().toISOString(),browser:browser.version(),scope:'v4 trace replay plus explicit net/high/outside position probes; 640 CSS px DPR2 is 200% equivalent, not native browser zoom',rows,errors};fs.writeFileSync('docs/benchmarks/014-visibility.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({cases:rows.length,errors}));
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
