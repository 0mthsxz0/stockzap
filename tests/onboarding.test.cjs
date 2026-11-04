const {test}=require('node:test');const assert=require('node:assert/strict');
const C=require('../js/onboarding-core.js'),S=require('../js/onboarding-service.js');
const answers={operacao:'fixo',segmento:'mercado',oferta:'prontos',quantidade:'ate20',estoque:'estoque',canais:['local'],controle:'papel',financeiro:'papel',equipe:'so_eu',whatsapp:'nao',prioridade:'estoque'};
function client({saved=null,failure=false,current='ana'}={}){
 const calls=[];
 const query={select:()=>query,eq:(field,id)=>{calls.push([field,id]);return query;},order:()=>query,limit:()=>query,maybeSingle:async()=>({data:saved?{respostas:saved}:null,error:failure?{}:null}),insert:row=>{calls.push(row);query.row=row;return query;},single:async()=>({data:query.row,error:failure?{}:null})};
 return {calls,from:()=>query,auth:{getUser:async()=>({data:{user:{id:current}},error:null})}};
}
const memory=()=>{const data=new Map();return {data,setItem:(k,v)=>data.set(k,v),getItem:k=>data.get(k)??null};};
test('incompleto não libera dashboard; produção exige perguntas condicionais',()=>{
 assert.equal(C.valid(answers),true);assert.equal(C.valid({...answers,prioridade:undefined}),false);
 assert.equal(C.valid({...answers,oferta:'producao'}),false);
 assert.equal(C.valid({...answers,oferta:'producao',insumos:'sim',receita:'nao'}),true);
 assert.equal(C.valid({...answers,canais:[]}),false);
});
test('retorno em outro navegador usa respostas do banco e reconstrói personalização',async()=>{
 const c=client({saved:answers}),storage=memory();const config=await S.load(c,{id:'ana'},storage);
 assert.equal(config.perfil.prioridade,'Estoque');assert.deepEqual(c.calls[0],['usuario_id','ana']);
 assert.equal(JSON.parse(storage.getItem('stockzap:usuario:ana:perfil-zapchat:v1')).perfil.segmento,'Mercado / Conveniência');
});
test('cache local antigo não marca onboarding como concluído',async()=>{
 const storage=memory();storage.setItem('stockzap:usuario:ana:perfil-zapchat:v1','{}');
 assert.equal(await S.load(client(),{id:'ana'},storage),null);
});
test('falha da consulta não equivale a primeiro acesso',async()=>assert.rejects(()=>S.load(client({failure:true}),{id:'ana'},memory()),/consultar/));
test('salvar só confirma conclusão após persistência e não inclui perguntas fora do fluxo',async()=>{
 const c=client(),config=await S.save(c,{id:'ana'},{...answers,insumos:'sim'},memory());
 assert.equal(config.perfil.prioridade,'Estoque');assert.equal(c.calls[0].usuario_id,'ana');assert.equal(c.calls[0].respostas.insumos,undefined);
});
test('troca de conta ou falha no insert impede sucesso',async()=>{
 const c=client({current:'bia'});await assert.rejects(()=>S.save(c,{id:'ana'},answers,memory()),/sessão/);assert.equal(c.calls.length,0);
 await assert.rejects(()=>S.save(client({failure:true}),{id:'ana'},answers,memory()),/salvar/);
});
test('cache indisponível não obriga refazer respostas persistidas',async()=>{
 const storage={setItem(){throw Error('Quota');}};
 assert.ok(await S.load(client({saved:answers}),{id:'ana'},storage));assert.ok(await S.save(client(),{id:'ana'},answers,storage));
});
// Testa as rotas das páginas com Auth e banco simulados, sem enviar emails ou criar contas.
const fs=require('node:fs'),vm=require('node:vm');
async function route({user={id:'ana'},saved=null,error=null}={}){
 const nodes=new Map(),listeners={};let destination=null;
 const node=id=>{if(!nodes.has(id))nodes.set(id,{style:{},textContent:''});return nodes.get(id);};
 const authClient=client({saved});authClient.auth.getUser=async()=>({data:{user},error});authClient.auth.onAuthStateChange=()=>{};
 const context={document:{getElementById:node,addEventListener:(name,fn)=>listeners[name]=fn},stockzapSupabase:authClient,StockZapOnboardingService:S,localStorage:memory(),window:{location:{replace:url=>destination=url}},setTimeout};
 vm.runInNewContext(fs.readFileSync('js/primeiro_contato/autenticando.js','utf8'),context);await listeners.DOMContentLoaded();await context.verificarSessao();await new Promise(r=>setImmediate(r));
 return {destination,node};
}
test('primeira sessão vai ao ZapChat e retorno concluído vai ao dashboard',async()=>{
 assert.equal((await route()).destination,'zapchat.html');
 assert.equal((await route({saved:answers})).destination,'../funcionalidades_internas/dashboard.html');
});
test('sem sessão pede confirmação/entrada e não grava respostas',async()=>{
 const r=await route({user:null});assert.equal(r.destination,null);assert.match(r.node('titulo').textContent,/e-mail/);
});
test('dashboard digitado diretamente continua protegido pelo questionário',async()=>{
 const nodes=new Map();const node=id=>{if(!nodes.has(id))nodes.set(id,{hidden:false,textContent:'',replaceChildren(){},append(){}});return nodes.get(id);};
 let redirected=null;
 const c=client();c.auth.onAuthStateChange=()=>{};
 const ctx={document:{getElementById:node,documentElement:{dataset:{session:'pending'}},createElement:()=>({addEventListener(){},append(){},setAttribute(){}})},stockzapSupabase:c,StockZapOnboardingService:S,localStorage:memory(),window:{location:{replace:url=>redirected=url},addEventListener(){}},setTimeout,clearTimeout};
 vm.runInNewContext(fs.readFileSync('js/app.js','utf8'),ctx);
 assert.equal(await ctx.window.StockZap.ready,null);assert.equal(redirected,'../primeiro_contato/zapchat.html');assert.equal(ctx.document.documentElement.dataset.session,'pending');
});
test('cadastro sem sessão segue para confirmação sem escrever em tabelas legadas',async()=>{
 let submit,destination,options;const button={disabled:false};
 const nodes={formCadastro:{addEventListener:(_,fn)=>submit=fn,querySelector:()=>button},nome_user:{value:'Ana'},nome_empresa:{value:'Mercado'},email:{value:'ana@example.test'},senha:{value:'senha-teste'}};
 const ctx={document:{getElementById:id=>nodes[id]},stockzapSupabase:{auth:{signUp:async value=>{options=value;return {data:{session:null,user:{id:'ana'}},error:null};}},from(){throw Error('Não deve usar tabelas legadas');}},window:{location:{href:'https://stockzap.vercel.app/html/primeiro_contato/cadastro.html',replace:url=>destination=url}},URL,alert:()=>{}};
 vm.runInNewContext(fs.readFileSync('js/primeiro_contato/cadastro.js','utf8'),ctx);await submit({preventDefault(){}});
 assert.equal(destination,'autenticando.html');assert.equal(options.options.emailRedirectTo,'https://stockzap.vercel.app/html/primeiro_contato/autenticando.html');assert.equal(button.disabled,false);
});
test('questionário libera continuação apenas após salvar e impede duplo envio',async()=>{
 const elements=new Map();class E{constructor(){this.style={};this.children=[];}append(x){this.children.push(x);}addEventListener(){}setAttribute(){}}
 const node=id=>{if(!elements.has(id))elements.set(id,new E());return elements.get(id);};
 const c=client();let destination=null;
 const ctx={document:{getElementById:node,createElement:()=>new E(),addEventListener(){}},StockZapOnboarding:C,StockZapOnboardingService:S,stockzapSupabase:c,localStorage:{...memory(),removeItem(){}},window:{location:{replace:url=>destination=url}},alert:()=>{},setTimeout};
 vm.runInNewContext(fs.readFileSync('js/primeiro_contato/zapchat.js','utf8'),ctx);
 vm.runInNewContext('usuarioZapChat={id:"ana"};Object.assign(respostas,'+JSON.stringify(answers)+');',ctx);
 await Promise.all([ctx.finalizarZapChat(),ctx.finalizarZapChat()]);
 assert.equal(c.calls.length,1);ctx.entrarNoStockZap();assert.equal(destination,'../funcionalidades_internas/dashboard.html');
});
