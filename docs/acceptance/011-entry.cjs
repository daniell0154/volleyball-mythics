const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const page=await browser.newPage({viewport:{width:1440,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const url='http://127.0.0.1:5176/docs/acceptance/011-preview/';
 await page.goto(url);await page.getByRole('heading',{name:'Samuel',exact:true}).waitFor();
 const roster=page.getByRole('group',{name:'Escolher atleta em destaque'});if(await roster.getByRole('button').count()!==5)throw Error('catalog is not dynamic');
 await page.waitForSelector('canvas');if(await page.locator('canvas').count()!==1)throw Error('multiple previews');
 await roster.getByRole('button',{name:'Caio',exact:true}).click();await page.getByRole('heading',{name:'Caio',exact:true}).waitFor();
 for(const label of ['Saque','Recepção','Levantamento','Ataque','Bloqueio','Velocidade','Salto'])if(!await page.getByText(label,{exact:true}).count())throw Error('missing attribute '+label);
 await page.screenshot({path:'docs/acceptance/011-entry.png',fullPage:true});
 await roster.getByRole('button',{name:/nome deliberadamente/}).click();await page.getByRole('heading',{name:/nome deliberadamente/}).waitFor();
 if(await page.locator('canvas').count()!==1)throw Error('preview accumulated');
 await page.goto(url+'?catalog=empty');await page.getByText('Nenhum atleta disponível no momento.',{exact:false}).waitFor();
 await page.goto(url+'?catalog=error');await page.getByRole('button',{name:'Tentar novamente'}).waitFor();
 console.log(JSON.stringify({catalogEntries:5,onePreview:true,states:['ready','empty','error'],errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
