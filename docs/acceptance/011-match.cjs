const {chromium}=require(require('node:path').resolve('.test-build/browser/node_modules/playwright'));
(async()=>{const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true});try{
 const contexts=[],pages=[],errors=[],url='http://127.0.0.1:5176/docs/acceptance/011-preview/';
 for(let i=0;i<2;i++){const context=await browser.newContext({viewport:{width:1440,height:1100}}),page=await context.newPage();contexts.push(context);pages.push(page);page.on('pageerror',e=>errors.push(e.message));await page.goto(url);await page.getByLabel('Seu apelido',{exact:true}).fill('HUD '+i);}
 await pages[0].getByRole('button',{name:'Criar sala',exact:true}).click();
 const invite=await pages[0].getByLabel('Link de convite',{exact:true}).inputValue();
 await pages[1].getByLabel('Código da sala',{exact:true}).fill(new URL(invite).searchParams.get('room'));await pages[1].getByRole('button',{name:'Entrar',exact:true}).click();
 for(const page of pages)await page.getByRole('button',{name:'Pronto para jogar',exact:true}).click();
 await pages[0].getByRole('button',{name:'Iniciar partida',exact:true}).click();
 await pages[0].getByLabel('Partida online',{exact:true}).waitFor();
 await pages[0].getByText('Áudio e imagem',{exact:true}).press('Enter');
 const volume=pages[0].getByRole('slider',{name:'Volume dos sinais sonoros'});
 await volume.focus();await pages[0].keyboard.press('Home');if(await volume.inputValue()!=='0')throw Error('volume not muted');
 await pages[0].getByRole('checkbox',{name:/Câmera estável/}).check();
 if(!await pages[0].getByRole('checkbox',{name:/Câmera estável/}).isChecked())throw Error('stable camera not enabled');
 await pages[0].getByRole('checkbox',{name:/Câmera estável/}).uncheck();
 await pages[0].getByRole('button',{name:'Sacar · L',exact:true}).waitFor();
 await pages[0].waitForFunction(()=>[...document.querySelectorAll('button')].some(b=>b.textContent==='Sacar · L'&&!b.disabled));
 await pages[0].getByLabel('Quadra em terceira pessoa. Clique para usar o teclado.',{exact:true}).focus();await pages[0].keyboard.press('l');
 await pages[0].getByText('Em jogo',{exact:true}).waitFor();
 await pages[0].screenshot({path:'docs/acceptance/011-match.png',fullPage:true});
 if(await pages[0].locator('canvas').count()!==1)throw Error('game canvas accumulated');
 for(const context of contexts)await context.close();
 console.log(JSON.stringify({hud:true,volume:true,stableCamera:true,keyboardServe:true,errors}));if(errors.length)process.exitCode=1;
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
