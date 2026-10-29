'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{serve}=require('./support/http.cjs');let browser,host;
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']});
 for(const mount of ['/','/stockzap/']){
  host=await serve({mount,protectedPreview:true});const page=await browser.newPage();page.setDefaultTimeout(18000);const errors=[],cloud=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.url().includes('supabase.co'))cloud.push(r.url());});
  await page.goto(host.url+'/authorize-preview');await page.getByRole('button',{name:/Simular venda de um café/}).click();
  await Promise.race([page.getByText(/Pronto! Café Cerrado/).waitFor(),page.getByRole('button',{name:'Tentar novamente ↻'}).waitFor()]);
  assert.match(await page.locator('#demo-feedback').innerText(),/^Pronto!/,JSON.stringify({mount,blocked:host.blocked,errors}));assert.equal(await page.locator('#result-stock').innerText(),'6 → 5 unidades');assert.deepEqual(host.blocked,[]);assert.equal(cloud.length,0);assert.deepEqual(errors,[]);
  const frame=page.frameLocator('iframe');
  await frame.locator('body').evaluate(n=>{const script=document.createElement('script');script.textContent='window.unexpectedDemoScript=true';n.append(script);});assert.equal(await frame.locator('body').evaluate(()=>window.unexpectedDemoScript),undefined);
  assert.equal(await frame.locator('body').evaluate(()=>{try{parent.localStorage.getItem('stockzap:auth:v2');return false;}catch{return true;}}),true);
  await page.getByRole('link',{name:'Entrar',exact:true}).click();assert.equal(new URL(page.url()).pathname,mount+'login.html');await page.waitForLoadState('networkidle');
  assert.equal(await page.evaluate(()=>typeof StockZapAuth.client().auth.signInWithPassword),'function');
  console.log('Prévia protegida aprovada em '+mount+'; demo isolada sem recursos externos e autenticação inicializada.');await page.close();await host.close();host=null;
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(async()=>{await browser?.close();await host?.close();});
