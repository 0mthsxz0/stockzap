'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require.resolve('../js/auth-forms.js'),'utf8');
function harness({kind='login',values={},storage=new Map(),clock={now:1000}}={}){
 const events={},calls=[],button={textContent:'Enviar',disabled:false},google={disabled:false,addEventListener:(event,fn)=>events.google=fn};
 const message={hidden:true,classList:{toggle(){}},setAttribute(){}};
 const form={dataset:{authForm:kind},reportValidity:()=>true,querySelector:()=>button,addEventListener:(event,fn)=>events[event]=fn,reset(){}};
 let response={error:{code:'invalid_credentials'}},reject=false;
 const auth=Object.fromEntries(['signInWithPassword','signUp','signInWithOAuth','resetPasswordForEmail','updateUser'].map(method=>[method,async (payload,options)=>{calls.push({method,payload,options});if(reject)throw Error('Network');return response;}]));
 const window={StockZapSite:{url:p=>'https://site.test/sub/'+p,loading(){},loaded(){}},StockZapAuth:{client:()=>({auth}),health:async()=>{},user:async()=>({id:'u'}),authMessage:()=> 'Credenciais inválidas',version:'v1'}};
 vm.runInNewContext(source,{window,document:{body:{dataset:{}},querySelector:s=>s==='[data-auth-form]'?form:s==='[data-auth-message]'?message:s==='[data-google-login]'?google:null},FormData:class{*[Symbol.iterator](){yield* Object.entries({email:'user@example.test',senha:'123456',confirmar:'123456',nome:'Nome',empresa:'Empresa',...values});}},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>storage.set(k,v)},Date:{now:()=>clock.now},location:{replace(){}}});
 return {calls,message,button,submit:()=>events.submit({preventDefault(){}}),google:()=>events.google({currentTarget:google}),respond:v=>{response=v;},offline:()=>{reject=true;}};
}
test('cinco erros bloqueiam a sexta chamada, persistem no reload e expiram após 15 minutos',async()=>{
 const storage=new Map(),clock={now:1000},h=harness({storage,clock});
 for(let n=0;n<5;n++)await h.submit();assert.equal(h.calls.length,5);assert.match(h.message.textContent,/5 erros/);
 await h.submit();assert.equal(h.calls.length,5);
 const reloaded=harness({storage,clock});await reloaded.submit();assert.equal(reloaded.calls.length,0);
 clock.now+=15*60000;await reloaded.submit();assert.equal(reloaded.calls.length,1);assert.match(reloaded.message.textContent,/Restam 4/);
});
test('erros de rede e e-mail não confirmado não consomem tentativas; sucesso limpa contador',async()=>{
 const h=harness();h.respond({error:{code:'email_not_confirmed'}});for(let n=0;n<6;n++)await h.submit();
 h.respond({error:{code:'invalid_credentials'}});await h.submit();assert.match(h.message.textContent,/Restam 4/);
 h.respond({error:null});await h.submit();h.respond({error:{code:'invalid_credentials'}});await h.submit();assert.match(h.message.textContent,/Restam 4/);
 const offline=harness();offline.offline();for(let n=0;n<6;n++)await offline.submit();assert.equal(offline.calls.length,6);assert.equal(offline.button.disabled,false);
});
test('cadastro exige senhas iguais e aceita seis caracteres',async()=>{
 const wrong=harness({kind:'cadastro',values:{confirmar:'outra'}});await wrong.submit();assert.equal(wrong.calls.length,0);assert.match(wrong.message.textContent,/senhas precisam/);
 const short=harness({kind:'cadastro',values:{senha:'12345',confirmar:'12345'}});await short.submit();assert.equal(short.calls.length,0);
 const ok=harness({kind:'cadastro'});ok.respond({data:{session:null},error:null});await ok.submit();assert.equal(ok.calls[0].method,'signUp');assert.equal(ok.calls[0].payload.password,'123456');
});
test('Google usa callback PKCE da publicação e recuperação mantém fluxo recovery',async()=>{
 const h=harness();h.respond({error:null});await h.google();assert.equal(h.calls[0].payload.provider,'google');assert.equal(h.calls[0].payload.options.redirectTo,'https://site.test/sub/auth/callback.html');
 const recovery=harness({kind:'recuperar'});recovery.respond({error:null});await recovery.submit();assert.equal(recovery.calls[0].options.redirectTo,'https://site.test/sub/auth/callback.html?flow=recovery');
});
