'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{serve}=require('./support/http.cjs');let browser,host;
(async()=>{
 host=await serve();browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.setDefaultTimeout(10000);
 const waitGone=()=>page.locator('.zap-transition').waitFor({state:'detached'});
 for(const width of [1440,375]){
  await page.setViewportSize({width,height:900});await page.goto(host.url+'/login.html');await page.locator('#email').focus();
  await page.evaluate(()=>StockZapSite.loading('Carregando uma página de teste…'));
  await page.locator('.zap-bolt').waitFor();assert.equal(await page.locator('.zap-panel').count(),2);
  await page.waitForTimeout(650);assert.equal(await page.locator('.zap-transition').count(),1);assert.equal(await page.locator('.zap-transition').evaluate(n=>n.classList.contains('is-opening')),false);
  assert.equal(await page.locator('body').getAttribute('aria-busy'),'true');assert.ok(await page.locator('html').evaluate(n=>n.scrollWidth<=innerWidth));
  const bolt=await page.locator('.zap-bolt').boundingBox();assert.ok(Math.abs(bolt.y)<1&&Math.abs(bolt.height-900)<1,'O raio deve cobrir toda a altura');
  assert.equal(await page.locator('.zap-seam').count(),0);
  if(width===1440)await page.screenshot({path:'/tmp/stockzap-lightning.png'});
  await page.evaluate(()=>StockZapSite.loaded());await page.waitForTimeout(200);
  const transforms=await page.locator('.zap-panel').evaluateAll(nodes=>nodes.map(n=>getComputedStyle(n).transform));assert.ok(transforms.every(t=>t!=='none'));
  await waitGone();assert.equal(await page.locator('body').getAttribute('aria-busy'),null);assert.equal(await page.locator('#email').evaluate(n=>document.activeElement===n),true);
 }
 // A new request cancels both a scheduled reveal and an already running reveal.
 await page.evaluate(()=>{StockZapSite.loading('Primeiro');StockZapSite.loaded();StockZapSite.loading('Segundo');});
 await page.waitForTimeout(800);assert.equal(await page.locator('.zap-transition.is-opening').count(),0);assert.equal(await page.locator('.zap-transition').count(),1);
 await page.evaluate(()=>StockZapSite.loaded());await page.waitForTimeout(150);await page.evaluate(()=>StockZapSite.loading('Terceiro'));
 await page.waitForTimeout(700);assert.equal(await page.locator('.zap-transition').count(),1);assert.equal(await page.locator('[data-loading-message]').innerText(),'Terceiro');
 await page.evaluate(()=>StockZapSite.loaded());await waitGone();
 await page.emulateMedia({reducedMotion:'reduce'});await page.evaluate(()=>StockZapSite.loading('Sem movimento'));
 assert.equal(await page.locator('.zap-bolt').evaluate(n=>getComputedStyle(n).animationName),'none');
 await page.evaluate(()=>StockZapSite.loaded());await waitGone();
 await page.emulateMedia({reducedMotion:'no-preference'});
 await page.evaluate(()=>StockZapSite.handoff());await page.reload();await page.evaluate(()=>StockZapSite.loading('Chegando'));
 assert.equal(await page.locator('.zap-arrived').count(),1);assert.equal(await page.locator('.zap-bolt').evaluate(n=>getComputedStyle(n).animationName),'none');
 await page.evaluate(()=>window.dispatchEvent(new PageTransitionEvent('pageshow',{persisted:true})));assert.equal(await page.locator('.zap-transition').count(),0);
 await page.evaluate(()=>StockZapSite.handoff());await page.goto(host.url+'/redefinir-senha.html');await page.locator('.zap-arrived').waitFor();await waitGone();
 await page.route('**/js/stockzap-auth.js',route=>route.fulfill({contentType:'text/javascript',body:`window.StockZapAuth={client:()=>({auth:{onAuthStateChange(){}}}),user:async()=>{await new Promise(resolve=>setTimeout(resolve,350));throw Object.assign(new Error('Falha simulada'),{status:503});}};`}));
 let releaseSDK;const sdkReady=new Promise(resolve=>{releaseSDK=resolve;});
 await page.route('**/js/supabase-vendor.js',async route=>{await sdkReady;await route.continue();});
 await page.evaluate(()=>StockZapSite.handoff());
 await page.goto(host.url+'/app.html',{waitUntil:'commit'});
 const bootstrap=page.locator('[data-zap-bootstrap]');await bootstrap.waitFor();
 assert.equal(await page.locator('.zap-transition').count(),1);assert.equal(await page.locator('.loading-screen,.loading-content,.loading-bolt').count(),0);
 assert.equal(await bootstrap.locator('.zap-bolt').evaluate(n=>getComputedStyle(n).animationName),'none');
 await bootstrap.evaluate(n=>{n.dataset.identity='original-bootstrap';});releaseSDK();
 await page.getByRole('heading',{name:'Não foi possível abrir seu espaço'}).waitFor();
 assert.equal(await page.locator('[data-identity="original-bootstrap"]').count(),1,'A cortina inicial deve ser reutilizada, sem piscar outra tela');await waitGone();
 assert.deepEqual(errors,[]);console.log('Raio aprovado: queda e abertura em desktop/celular, espera pelos dados, foco restaurado, cancelamento de transições antigas, movimento reduzido, navegação e falha sem bloqueio.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();await host?.close();});
