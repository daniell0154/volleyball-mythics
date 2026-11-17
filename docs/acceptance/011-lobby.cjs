const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const errors=[],contexts=[],pages=[],url='http://127.0.0.1:5176/docs/acceptance/011-preview/';
 for(let i=0;i<2;i++){const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();contexts.push(context);pages.push(page);page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.getByLabel('Seu apelido',{exact:true}).fill('Jogador '+i);}
 await pages[0].getByRole('button',{name:'Criar sala',exact:true}).click();
 await pages[0].getByRole('heading',{name:/Seu time/}).waitFor();
 if(!await pages[0].getByRole('button',{name:'Iniciar partida',exact:true}).isDisabled())throw Error('incomplete room enabled');
 await pages[0].getByText(/Falta 1 jogador/).waitFor();
 const invite=await pages[0].getByLabel('Link de convite',{exact:true}).inputValue(),code=new URL(invite).searchParams.get('room');
 await pages[1].getByLabel('Código da sala',{exact:true}).fill(code);await pages[1].getByRole('button',{name:'Entrar',exact:true}).click();
 await pages[1].getByRole('heading',{name:/Seu time/}).waitFor();
 for(const page of pages)await page.getByRole('button',{name:'Pronto para jogar',exact:true}).click();
 await pages[0].waitForFunction(()=>!document.querySelector('button.primary')?.disabled);
 if(!await pages[1].getByRole('button',{name:'Iniciar partida',exact:true}).isDisabled())throw Error('non-owner can start');
 await pages[0].screenshot({path:'docs/acceptance/011-lobby.png',fullPage:true});
 await pages[0].getByRole('group',{name:'Escolher atleta em destaque'}).getByRole('button',{name:'Caio',exact:true}).click();
 await pages[0].getByText(/Todos precisam marcar Pronto/).waitFor();
 for(const context of contexts)await context.close();
 console.log(JSON.stringify({repeatedCharacters:true,ownerOnly:true,readyInvalidation:true,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
