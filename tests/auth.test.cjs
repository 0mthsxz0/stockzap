'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
function auth({error=null,blocked=false,protocol='https:'}={}){
 const window={STOCKZAP_CONFIG:{supabaseUrl:'https://project.supabase.co',supabasePublishableKey:'sb_publishable_test'},supabase:{createClient:()=>({auth:{getUser:async()=>({error,data:error?{}:{user:{id:'owner'}}})}})}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/stockzap-auth.js'),'utf8'),{window,location:{protocol},localStorage:{setItem(){if(blocked)throw Error('Blocked');},removeItem(){}},URL,AbortSignal,fetch:()=>{throw Error('Unexpected request');}});return window.StockZapAuth;
}
test('erro de rede na verificação não é tratado como sessão inválida',async()=>{
 await assert.rejects(auth({error:{status:0,message:'Failed to fetch'}}).user(),{status:503,code:'auth_unavailable'});
 await assert.rejects(auth({error:{status:401}}).user(),{status:401,code:'session_missing'});
});
test('erros de autenticação distinguem credenciais, confirmação e rede sem enumerar contas',()=>{
 const a=auth();assert.match(a.authMessage({code:'invalid_credentials'}),/E-mail ou senha incorretos/);assert.match(a.authMessage({code:'email_not_confirmed'}),/Confirme seu e-mail/);assert.match(a.authMessage({message:'Failed to fetch'}),/conectar/);assert.match(a.authMessage({status:429}),/Muitas tentativas/);
});
test('arquivo local e armazenamento bloqueado recebem diagnóstico acionável',()=>{
 assert.throws(()=>auth({protocol:'file:'}).client(),{code:'web_server_required'});assert.throws(()=>auth({blocked:true}).client(),{code:'storage_unavailable'});
});
test('links e callbacks mantêm a subpasta do site',()=>{
 const window={},document={currentScript:{src:'https://preview.example.test/projetos/stockzap/js/site.js'}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../js/site.js'),'utf8'),{window,document,URL});assert.equal(window.StockZapSite.url('auth/callback.html'),'https://preview.example.test/projetos/stockzap/auth/callback.html');assert.equal(window.StockZapSite.url('/app.html'),'https://preview.example.test/projetos/stockzap/app.html');
});
