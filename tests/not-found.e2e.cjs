'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{serve}=require('./support/http.cjs');let browser,host;
(async()=>{
 host=await serve();browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const page=await browser.newPage(),errors=[],missing=[];page.on('pageerror',error=>errors.push(error.message));page.on('response',response=>{if(['stylesheet','image','font','script'].includes(response.request().resourceType())&&response.status()>=400)missing.push(response.url());});
 for(const width of [1440,375,320]){
  await page.setViewportSize({width,height:900});const response=await page.goto(host.url+'/caminho/que-nao-existe');assert.equal(response.status(),404);
  await page.getByRole('heading',{name:'Essa página não está no estoque.'}).waitFor();
  assert.ok(await page.locator('header img').evaluate(image=>image.complete&&image.naturalWidth>0));assert.ok(await page.locator('html').evaluate(n=>n.scrollWidth<=innerWidth+1));
  assert.equal(await page.getByRole('link',{name:'Voltar ao início',exact:false}).getAttribute('href'),'/');
  assert.equal(await page.getByRole('link',{name:'Abrir minha empresa'}).getAttribute('href'),'/app.html');
  if(width===1440||width===375)await page.screenshot({path:'/tmp/stockzap-404-'+width+'.png',fullPage:true});
 }
 await page.getByRole('link',{name:'Voltar ao início',exact:false}).click();assert.equal(new URL(page.url()).pathname,'/');
 await page.goto(host.url+'/404.html');await page.getByRole('link',{name:'Entrar na conta'}).click();await page.locator('[data-auth-form="login"]').waitFor();
 assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);console.log('404 aprovada: status HTTP 404 em caminho profundo, assets, links funcionais e layout sem overflow em 320, 375 e 1440px.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();await host?.close();});
