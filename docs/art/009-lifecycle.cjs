const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
const fs=require('node:fs');
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1280,height:720}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:5176/docs/art/009-lifecycle.html');await page.waitForFunction(()=>typeof window.runLifecycle==='function');
 const result=await page.evaluate(()=>window.runLifecycle());const report={browser:await browser.version(),...result,errors};report.pass&&=errors.length===0;
 fs.writeFileSync('docs/art/009-lifecycle.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));if(!report.pass)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
