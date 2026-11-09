'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),{seed}=require('../js/erp/demo.js'),C=require('../js/erp/core.js');
const O=require('../js/erp/onboarding.js');
function readyState(){const state=seed();state.onboarding={version:1,completed:true,answers:Object.fromEntries(O.flow().map(key=>[key,O.questions[key].tipo==='multi'?[O.questions[key].opcoes[0].id]:O.questions[key].opcoes[0].id]))};return state;}
function harness({accepted=true,failAccept=false,role='owner'}={}){
 const listeners={},nodes=new Map(),seen=[];let resolveState;
 const deferred=new Promise(resolve=>{resolveState=resolve;});
 function node(id){if(!nodes.has(id))nodes.set(id,{html:'',attrs:{},set innerHTML(v){this.html=v;if(id==='app')seen.push(v);},get innerHTML(){return this.html;},setAttribute(k,v){this.attrs[k]=v;},replaceChildren(){this.html='';},querySelector(){return null;},querySelectorAll(){return [];},addEventListener(){}});return nodes.get(id);}
 const document={body:{dataset:{}},hidden:false,getElementById:node,querySelector:()=>node('error'),addEventListener:(event,fn)=>{listeners[event]=fn;}};
 const window={SZOnboarding:O,SZCore:C,SZUI:{esc:String,icon:()=>'',date:()=>'',badge:()=>'',statusBadge:()=>'',initials:()=>'',applyTheme(){}},SZViews:{dashboard:()=>'<h1>Painel pronto</h1>'},StockZapSite:{url:p=>'https://stockzap.test/'+p},StockZapAuth:{user:async()=>({id:'u',user_metadata:{}}),version:'v1',client:()=>({auth:{onAuthStateChange(){}}}),request:async path=>{if(path==='legal-status')return {accepted};if(path==='legal-accept'){if(failAccept)throw Error('Conexão indisponível');accepted=true;return {};}if(path==='companies')return {companies:[{id:'c',role}],profile:{name:'Teste'}};if(path==='state')return deferred;}},addEventListener(){},scrollTo(){}};window.parent=window;
 const source=fs.readFileSync(require.resolve('../js/erp/app.js'),'utf8').replace('  init();','  window.testInit=init;');
 vm.runInNewContext(source,{window,document,location:{search:'',hash:'',replace(){}},URLSearchParams,FormData:class{*[Symbol.iterator](){}},localStorage:{getItem(){return null;}},setInterval(){},setTimeout(){},matchMedia:()=>({addEventListener(){}})});
 return {init:window.testInit,app:node('app'),error:node('error'),content:node('page-content'),seen,resolveState,listeners};
}
const flush=()=>new Promise(resolve=>setImmediate(resolve));
test('mantém carregamento durante consulta lenta e só apresenta painel quando há estado',async()=>{
 const h=harness(),pending=h.init();await flush();assert.match(h.app.innerHTML,/Carregando produtos/);assert.equal(h.app.attrs['aria-busy'],'true');assert.equal(h.content.innerHTML,'');
 h.resolveState({state:readyState()});await pending;assert.equal(h.app.attrs['aria-busy'],'false');assert.match(h.content.innerHTML,/Painel pronto/);
});
test('após aceite dos termos mostra preparação e depois abre o painel',async()=>{
 const h=harness({accepted:false});await h.init();assert.match(h.app.innerHTML,/legal-form/);
 const button={disabled:false},form={id:'legal-form',hasAttribute:()=>false,querySelector:selector=>selector.includes('submit')?button:null};
 const pending=h.listeners.submit({target:form,preventDefault(){}});await flush();
 assert.ok(h.seen.some(html=>html.includes('Registrando seu aceite')));assert.match(h.app.innerHTML,/Carregando produtos/);
 h.resolveState({state:readyState()});await pending;assert.match(h.content.innerHTML,/Painel pronto/);assert.equal(button.disabled,false);
});
test('falha ao registrar aceite retorna ao formulário com erro e permite tentar novamente',async()=>{
 const h=harness({accepted:false,failAccept:true});await h.init();
 const button={disabled:false},form={id:'legal-form',hasAttribute:()=>false,querySelector:selector=>selector.includes('submit')?button:null};
 await h.listeners.submit({target:form,preventDefault(){}});assert.match(h.app.innerHTML,/legal-form/);assert.equal(h.app.attrs['aria-busy'],'false');assert.equal(h.error.textContent,'Conexão indisponível');assert.equal(button.disabled,false);
});
function loginHarness({failure=false}={}){
 let submit,resolveSignIn;const states=[],redirects=[];
 const button={textContent:'Entrar',disabled:false},message={hidden:true,classList:{toggle(){}},setAttribute(){}};
 const form={dataset:{authForm:'login'},reportValidity:()=>true,querySelector:()=>button,addEventListener:(_,fn)=>{submit=fn;},reset(){}};
 const waiting=new Promise(resolve=>{resolveSignIn=resolve;});
 const site={url:p=>'https://stockzap.test/'+p,loading:text=>states.push(text),loaded:()=>states.push('finished')};
 const window={StockZapSite:site,StockZapAuth:{client:()=>({auth:{signInWithPassword:()=>waiting}}),health:async()=>{},user:async()=>({id:'u'}),authMessage:()=> 'Não foi possível entrar.'}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../js/auth-forms.js'),'utf8'),{window,document:{body:{dataset:{}},querySelector:s=>s==='[data-auth-form]'?form:s==='[data-auth-message]'?message:null},FormData:class{*[Symbol.iterator](){yield ['email','teste@example.test'];yield ['senha','senha-ficticia'];}},location:{replace:url=>redirects.push(url)}});
 return {submit:()=>submit({preventDefault(){}}),resolve:()=>resolveSignIn({error:failure?Error('offline'):null}),states,redirects,button,message};
}
test('login lento mantém carregamento até redirecionar para o aplicativo',async()=>{
 const h=loginHarness(),pending=h.submit();await flush();assert.ok(h.states.some(s=>s.includes('Validando')));assert.equal(h.redirects.length,0);assert.equal(h.button.disabled,true);
 h.resolve();await pending;assert.deepEqual(h.redirects,['https://stockzap.test/app.html']);assert.equal(h.states.includes('finished'),false);
});
test('erro de login remove carregamento e permite nova tentativa',async()=>{
 const h=loginHarness({failure:true}),pending=h.submit();await flush();h.resolve();await pending;assert.equal(h.states.at(-1),'finished');assert.equal(h.button.disabled,false);assert.equal(h.message.hidden,false);assert.equal(h.redirects.length,0);
});

test('primeiro acesso do proprietário apresenta questionário antes do painel',async()=>{
 const h=harness(),pending=h.init();h.resolveState({state:seed()});await pending;
 assert.match(h.app.innerHTML,/onboarding-form/);assert.match(h.app.innerHTML,/Como funciona o seu negócio/);assert.equal(h.content.innerHTML,'');
});
test('operador não é obrigado a preencher questionário administrativo',async()=>{
 const h=harness({role:'operator'}),pending=h.init();h.resolveState({state:seed()});await pending;assert.match(h.content.innerHTML,/Painel pronto/);
});
