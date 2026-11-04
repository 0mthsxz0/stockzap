'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{spawn}=require('node:child_process'),path=require('node:path');
const root=path.resolve(__dirname,'..');
let server,browser;
(async()=>{
 server=spawn(process.execPath,['scripts/dev.cjs'],{cwd:root,stdio:['ignore','pipe','pipe']});
 await new Promise((resolve,reject)=>{server.stdout.on('data',d=>{if(String(d).includes('StockZap em'))resolve();});server.stderr.on('data',d=>process.stderr.write(d));server.on('error',reject);server.on('exit',c=>reject(new Error('Servidor encerrou: '+c)));});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[],cloud=[];page.setDefaultTimeout(12000);
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});page.on('request',r=>{if(r.url().includes('supabase.co'))cloud.push(r.url());});
 await page.goto('http://localhost:3000/',{waitUntil:'networkidle'});
 await page.getByRole('tab',{name:/Evitar surpresas/}).click();await page.getByRole('tabpanel',{name:/Evitar surpresas/}).waitFor({state:'visible'});
 await page.getByRole('tab',{name:/Entender seu dinheiro/}).focus();await page.keyboard.press('Home');assert.equal(await page.getByRole('tab',{name:/Vender sem retrabalho/}).getAttribute('aria-selected'),'true');
 await page.getByRole('button',{name:/Simular venda de um café/}).click();await page.getByText(/Pronto! Café Cerrado 500g/).waitFor();
 assert.equal(await page.locator('#result-stock').innerText(),'6 → 5 unidades');assert.match(await page.locator('#result-revenue').innerText(),/32,90/);
 const frame=page.frameLocator('iframe[title^="Demonstração"]');await frame.getByRole('heading',{name:'Pedidos',exact:true}).waitFor();
 assert.equal(await frame.locator('body').evaluate(()=>{try{parent.localStorage.getItem('stockzap:auth:v2');return false;}catch{return true;}}),true);
 await page.locator('#fullscreen-demo').click();assert.equal(await page.locator('.demo-window').evaluate(n=>n.classList.contains('expanded')),true);await page.locator('#fullscreen-demo').click();
 await page.locator('.demo-navigation').getByRole('button',{name:'Produtos',exact:true}).click();await frame.getByRole('button',{name:'Novo produto',exact:true}).click();
 const product=frame.locator('#product-form');
 for(const [name,value]of Object.entries({name:'Produto <img src=x onerror=alert(1)>',sku:'BROWSER-001',category:'Teste',price:'27.9',cost:'11',stock:'12',minStock:'2',targetStock:'20'}))await product.locator('[name="'+name+'"]').fill(value);
 // A real click catches form controls clipped by the embedded viewport.
 await product.getByRole('button',{name:'Salvar',exact:true}).click();await frame.locator('input[data-filter=text]').fill('BROWSER-001');await frame.getByText('Produto <img src=x onerror=alert(1)>',{exact:true}).waitFor();assert.equal(await frame.locator('img[src=x]').count(),0);
 await page.locator('.demo-navigation').getByRole('button',{name:'ZapChat',exact:true}).click();await frame.getByRole('button',{name:/preciso repor/}).click();await frame.getByText(/Café Cerrado 500g.*5/).first().waitFor();
 for(const width of [320,375,768,1024,1440,1920]){
  await page.setViewportSize({width,height:1000});await page.waitForTimeout(100);
  const sizes=await page.evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(sizes.scroll<=width+1,'Landing: '+JSON.stringify(sizes));
  const sizesDemo=await frame.locator('body').evaluate(()=>({width:innerWidth,scroll:document.documentElement.scrollWidth}));assert.ok(sizesDemo.scroll<=sizesDemo.width+1,'Demo: '+JSON.stringify(sizesDemo));
 }
 await page.setViewportSize({width:375,height:900});await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.getByRole('navigation',{name:'Navegação principal'}).getByRole('link',{name:'Recursos',exact:true}).click();assert.equal(await page.locator('.menu-toggle').getAttribute('aria-expanded'),'false');
 await page.waitForTimeout(1000);const anchor=await page.locator('#recursos').evaluate(n=>({top:n.getBoundingClientRect().top,header:document.querySelector('.site-header').getBoundingClientRect().bottom}));assert.ok(anchor.top>=anchor.header && anchor.top<anchor.header+35,JSON.stringify(anchor));
 assert.equal(await page.locator('.hero-visual,.dashboard-preview').count(),0);assert.equal(await page.locator('.feature-grid a').count(),6);
 await page.locator('#restart-demo').click();await frame.getByRole('heading',{name:'Seu negócio em um olhar.'}).waitFor();assert.equal(await page.locator('#result-stock').innerText(),'6 unidades');
 // Same product form remains usable on a phone with the page partly scrolled.
 await page.locator('.demo-navigation').getByRole('button',{name:'Produtos',exact:true}).click();await frame.getByRole('button',{name:'Novo produto',exact:true}).click();
 const mobileForm=frame.locator('#product-form');for(const [name,value]of Object.entries({name:'Produto celular',sku:'MOBILE-001',category:'Teste',price:'10',cost:'5',stock:'4',minStock:'1',targetStock:'10'}))await mobileForm.locator('[name="'+name+'"]').fill(value);
 await mobileForm.getByRole('button',{name:'Salvar',exact:true}).click();await frame.locator('input[data-filter=text]').fill('MOBILE-001');await frame.getByText('Produto celular',{exact:true}).waitFor();
 assert.equal(cloud.length,0,'A demonstração deve permanecer sem acesso à nuvem.');assert.deepEqual(errors,[]);
 const recovery=await browser.newPage({reducedMotion:'reduce'});let block=true;
 await recovery.route('**/demo.html',route=>block?route.abort():route.continue());await recovery.goto('http://localhost:3000/');await recovery.getByRole('button',{name:/Simular venda de um café/}).click();await recovery.getByRole('button',{name:'Tentar novamente ↻'}).waitFor({timeout:20000});block=false;await recovery.getByRole('button',{name:'Tentar novamente ↻'}).click();await recovery.frameLocator('iframe').getByRole('heading',{name:'Seu negócio em um olhar.'}).waitFor();
 const animation=await recovery.locator('.hero-copy').evaluate(n=>getComputedStyle(n).animationName);assert.equal(animation,'none');
 console.log('Demonstração: venda/estoque/receita, formulários em desktop e celular, ZapChat, isolamento, teclado, seis larguras, reinício, recuperação de falha e movimento reduzido aprovados.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();server?.kill();});

