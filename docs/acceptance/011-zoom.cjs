// Native Chrome zoom in a separate test profile; never opens the user's profile.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const {chromium}=require(path.resolve('.test-build/browser/node_modules/playwright'));
(async()=>{
 const profile=path.resolve('.test-build',`011-zoom-chrome-${Date.now()}`);
 const context=await chromium.launchPersistentContext(profile,{executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,viewport:null,args:['--window-size=1440,1100']});
 try{
  const settings=context.pages()[0];await settings.goto('chrome://settings/appearance');
  await settings.locator('select').filter({has:settings.getByRole('option',{name:'200%',exact:true})}).selectOption({label:'200%'},{timeout:15000});
  const page=await context.newPage();await page.goto('http://127.0.0.1:5176/docs/acceptance/011-preview/');
  await page.getByRole('heading',{name:'Samuel',exact:true}).waitFor();
  const metrics=await page.evaluate(()=>({width:innerWidth,outerWidth,dpr:devicePixelRatio,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(Math.abs(metrics.dpr-2)<.05,JSON.stringify(metrics));
  assert.ok(metrics.width<=720&&metrics.width>=650,JSON.stringify(metrics));
  await page.getByRole('button',{name:/nome deliberadamente/}).press('Enter');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  await page.screenshot({path:'docs/acceptance/011-zoom-native-chrome.png',fullPage:true});
  const report={date:new Date().toISOString(),name:'Chrome',version:context.browser().version(),nativeZoom:'200%',metrics,longName:true,horizontalOverflow:false,scope:'Entry and catalog; full journey uses equivalent viewport/DPR.',edge:'Native settings control unavailable to this automation; manual verification pending.'};
  fs.writeFileSync('docs/acceptance/011-zoom-results.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await context.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
