const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
const fs=require('node:fs/promises');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const context=await browser.newContext({viewport:{width:1280,height:760},recordVideo:{dir:'.test-build/009-video',size:{width:1280,height:760}}});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5176/docs/art/009-review.html');await page.waitForFunction(()=>typeof window.reviewAt==='function');
 await page.screenshot({path:'docs/art/009-animation.png'});await page.waitForTimeout(15000);
 const video=page.video();await context.close();await video.saveAs('docs/art/009-animation.webm');await video.delete();
 console.log(JSON.stringify({errors,video:'docs/art/009-animation.webm'}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
