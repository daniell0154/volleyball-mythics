// Full-page video also records the DOM cue used for occlusion/offscreen guidance.
const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));const {copyFileSync}=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 for(const side of ['A','B']){const context=await browser.newContext({viewport:{width:1280,height:720},recordVideo:{dir:'.test-build/014-video',size:{width:1280,height:720}}});const page=await context.newPage();await page.goto(`http://127.0.0.1:5178/docs/benchmarks/014-review.html?profile=4&side=${side}&stable=1`);await page.waitForFunction(()=>typeof window.reviewAt==='function');await page.waitForTimeout(8000);
 for(const ball of [{x:0,y:2,z:0},{x:4,y:12,z:8},{x:100,y:20,z:0}]){await page.evaluate(ball=>{window.manual=true;window.adapter.update({...window.trace[0],ball});},ball);await page.waitForTimeout(1500);}
 const video=page.video();await context.close();copyFileSync(await video.path(),`docs/benchmarks/014-page-${side}.webm`);}
 console.log('Full-page candidate clips A/B recorded, including DOM cues.');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
