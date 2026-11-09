'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),{serve}=require('./support/http.cjs');
const seed=require('../js/erp/demo.js').seed;
let browser,host;
(async()=>{
 host=await serve({mount:'/',protectedPreview:false});
 browser=await chromium.launch({headless:true,...(process.env.CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.CHROMIUM_EXECUTABLE_PATH}:{})});
 const page=await browser.newPage({viewport:{width:375,height:900}}),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));
 let state=seed();state.onboarding={};let saves=0,fail=false,conflict=false,role='owner';
 await page.route('**/js/stockzap-auth.js',route=>route.fulfill({contentType:'text/javascript',body:`window.StockZapAuth={version:'test',user:async()=>({id:'owner',user_metadata:{}}),client:()=>({auth:{onAuthStateChange(){}}}),request:async(path,options={})=>{const r=await fetch('/__fixture/'+path,{method:'POST',body:JSON.stringify(options.body||{})});const result=await r.json();if(!r.ok)throw Object.assign(new Error(result.error),{status:r.status,state:result.state});return result;}};`}));
 await page.route('**/__fixture/**',async route=>{
  const path=new URL(route.request().url()).pathname.split('/').at(-1),body=route.request().postDataJSON();let response;
  if(path==='legal-status')response={accepted:true};
  else if(path==='companies')response={companies:[{id:'company',role}],profile:{name:'Proprietário'}};
  else if(path==='state')response={state,aiEnabled:false};
  else if(path==='action'){
   assert.equal(body.companyId,'company');assert.equal(body.action,'onboarding.save');
   if(fail){fail=false;return route.fulfill({status:503,json:{error:'Falha simulada ao salvar. Tente novamente.'}});}
   if(conflict){conflict=false;state={...state,revision:state.revision+1};return route.fulfill({status:409,json:{error:'Outra aba alterou os dados. Revise e tente novamente.',state}});}
   assert.equal(body.revision,state.revision);state={...state,onboarding:body.payload,revision:state.revision+1};saves++;response={state};
  }else throw Error('Unexpected route '+path);
  return route.fulfill({json:response});
 });
 const next=async()=>{const old=saves;await page.locator('#onboarding-form [type=submit]').click();await page.waitForFunction(()=>!document.querySelector('#onboarding-form [type=submit]')?.disabled);assert.equal(saves,old+1);};
 await page.goto(host.url+'/app.html#dashboard');await page.locator('#onboarding-form').waitFor();
 assert.match(await page.locator('#question-title').innerText(),/Como funciona/);await page.locator('input[value=fixo]').check();
 fail=true;await page.locator('#onboarding-form [type=submit]').click();await page.getByRole('alert').filter({hasText:'Falha simulada'}).waitFor();assert.equal(saves,0);assert.equal(await page.locator('input[value=fixo]').isChecked(),true);await next();
 await page.reload();await page.locator('#question-title').filter({hasText:'Que tipo de negócio'}).waitFor();assert.equal(state.onboarding.answers.operacao,'fixo');
 await page.locator('input[value=alimentacao]').check();conflict=true;await page.locator('#onboarding-form [type=submit]').click();await page.getByRole('alert').filter({hasText:'Outra aba'}).waitFor();assert.equal(await page.locator('input[value=alimentacao]').isChecked(),true);await next();
 await page.locator('input[value=producao]').check();await next();assert.match(await page.locator('#question-title').innerText(),/matéria-prima/);
 let iterations=0;
 while(await page.locator('#onboarding-form').count()){
  assert.ok(iterations++<14);
  if(await page.locator('.priority-input').count()){
   const option=value=>page.locator('.questionnaire-option').filter({has:page.locator('input[value="'+value+'"]')});
   const badge=value=>page.locator('[data-priority-number="'+value+'"]');
   await option('financeiro').click();await option('estoque').click();await option('vendas').click();
   assert.equal(await badge('financeiro').innerText(),'1');assert.equal(await badge('estoque').innerText(),'2');assert.equal(await badge('vendas').innerText(),'3');
   await option('estoque').click();assert.equal(await badge('vendas').innerText(),'2');assert.equal(await badge('estoque').innerText(),'');
   await option('estoque').click();assert.equal(await badge('estoque').innerText(),'3');
   await page.locator('input[value="financeiro"]').focus();await page.keyboard.press('Space');assert.equal(await badge('vendas').innerText(),'1');
   await page.keyboard.press('Space');assert.equal(await badge('financeiro').innerText(),'3');
  }else if(await page.locator('input[type=checkbox]').count()){
   const old=saves;await page.locator('#onboarding-form [type=submit]').click();await page.getByRole('alert').filter({hasText:'Selecione pelo menos'}).waitFor();assert.equal(saves,old);
   await page.locator('input[type=checkbox]').first().check();await page.locator('input[type=checkbox]').nth(1).check();
  }else await page.locator('input[type=radio]').first().check();
  await next();
 }
 await page.getByRole('heading',{name:'Perfil da empresa',exact:true}).waitFor();assert.equal(state.onboarding.completed,true);assert.equal(saves,13);assert.equal(state.onboarding.answers.canais.length,2);assert.deepEqual(state.onboarding.answers.prioridade,['vendas','estoque','financeiro']);
 assert.match(await page.locator('.company-profile').last().innerText(),/1\. Vendas · 2\. Estoque · 3\. Financeiro/);
 assert.match(await page.locator('.company-profile').last().innerText(),/Produção própria/);
 assert.ok(await page.locator('html').evaluate(n=>n.scrollWidth<=innerWidth+1));
 await page.reload();await page.getByRole('heading',{name:'Perfil da empresa',exact:true}).waitFor();assert.equal(await page.locator('#onboarding-form').count(),0);
 await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.getByRole('link',{name:'Visão geral',exact:true}).click();await page.getByRole('button',{name:'Abrir menu',exact:true}).click();await page.getByRole('link',{name:'Abrir perfil da empresa'}).click();await page.getByRole('heading',{name:'Perfil da empresa',exact:true}).waitFor();
 await page.screenshot({path:'/tmp/stockzap-company-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'/tmp/stockzap-company-desktop.png',fullPage:true});await page.getByRole('button',{name:'Revisar respostas'}).click();assert.equal(await page.locator('input[value=fixo]').isChecked(),true);
 await next();await page.reload();await page.locator('#question-title').filter({hasText:'Que tipo de negócio'}).waitFor();await page.getByRole('button',{name:'Voltar',exact:true}).click();assert.equal(await page.locator('input[value=fixo]').isChecked(),true);await next();await next();
 await page.locator('input[value=prontos]').check();await next();assert.match(await page.locator('#question-title').innerText(),/itens diferentes/);
 while(await page.locator('#onboarding-form').count())await next();
 assert.equal(state.onboarding.answers.insumos,undefined);assert.equal(state.onboarding.answers.receita,undefined);
 await page.getByRole('button',{name:'Editar informações'}).click();await page.locator('#company-form').waitFor();
 role='operator';state.onboarding={};await page.goto(host.url+'/app.html#empresa');await page.getByRole('heading',{name:'Perfil da empresa',exact:true}).waitFor();assert.equal(await page.getByRole('button',{name:'Responder questionário'}).count(),0);
 assert.deepEqual(errors,[]);console.log('Questionário aprovado: 13 etapas, gravação/retomada, falha e conflito sem perda, seleção múltipla, perfil, edição, permissões, desktop e celular. Backend simulado.');
})().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{await browser?.close();await host?.close();});
