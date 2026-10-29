import test from 'node:test';
import assert from 'node:assert/strict';
import {createService} from '../supabase/functions/stockzap-api/service.mjs';
import {emptyWorkspace} from '../supabase/functions/stockzap-api/workspace.mjs';
const user={id:'a5de2297-88dc-4e56-a75a-52e98747c862',email:'test@example.invalid',user_metadata:{nome:'Teste'}};
const company='de9c2867-7539-4c85-9c4a-50b5aa7e98d0';
function fixture({role='owner',auth=true,limit=true,save=true}={}){
 const calls=[],state=emptyWorkspace(user);const fetcher=async(url,options={})=>{
  const path=new URL(url).pathname,q=new URL(url).searchParams;calls.push({path,method:options.method,body:options.body?JSON.parse(options.body):undefined,headers:options.headers});
  if(path==='/auth/v1/user')return Response.json(auth?user:{message:'Invalid token'},{status:auth?200:401});
  if(path.endsWith('stockzap_allow_request'))return Response.json(limit);
  if(path.endsWith('/stockzap_members'))return Response.json(role?[{role,company_id:company,user_id:user.id}]:[]);
  if(path.endsWith('/stockzap_states'))return Response.json([{state,revision:1}]);
  if(path.endsWith('stockzap_save_state'))return Response.json(save);
  if(path.endsWith('/stockzap_legal_acceptances'))return options.method==='POST'?new Response(null,{status:201}):Response.json([]);
  if(path.endsWith('/stockzap_privacy_requests'))return Response.json(options.method==='POST'?[{id:'protocol-test',...JSON.parse(options.body),status:'pending',created_at:new Date().toISOString()}]:[]);
  if(path.endsWith('/stockzap_profiles'))return Response.json([{id:user.id,name:'Teste',email:user.email,phone:''}]);
  throw new Error('Unexpected request '+url);
 };
 return {calls,state,service:createService({env:{SUPABASE_URL:'https://db.test',SUPABASE_ANON_KEY:'public-test',SUPABASE_SERVICE_ROLE_KEY:'private-test'},fetcher})};
}
const action={companyId:company,revision:1,action:'transaction.create',payload:{type:'Receita',description:'Teste',category:'Teste',amount:10,date:'2026-10-19',dueDate:'2026-10-19',status:'Pago'}};
test('token ausente ou inválido não alcança os registros de negócio',async()=>{
 for(const auth of [false,true]){const f=fixture({auth});await assert.rejects(f.service.run('state','GET',auth?null:'Bearer invalid',{companyId:company}),{status:401});assert.ok(!f.calls.some(c=>c.path.includes('stockzap_states')));}
});
test('membro de outra empresa recebe 403 e não carrega dados',async()=>{
 const f=fixture({role:null});await assert.rejects(f.service.run('state','GET','Bearer valid',{companyId:company}),{status:403});assert.ok(!f.calls.some(c=>c.path.includes('stockzap_states')));
});
test('visualizador não altera registros e operador não muda equipe',async()=>{
 for(const [role,a] of [['viewer',action],['operator',{...action,action:'team.save'}]]){const f=fixture({role});await assert.rejects(f.service.run('action','POST','Bearer valid',a),{status:403});assert.ok(!f.calls.some(c=>c.path.includes('stockzap_save_state')));}
});
test('revisão desatualizada e corrida de gravação retornam 409',async()=>{
 const old=fixture();await assert.rejects(old.service.run('action','POST','Bearer valid',{...action,revision:99}),{status:409});
 const race=fixture({save:false});await assert.rejects(race.service.run('action','POST','Bearer valid',action),{status:409});
});
test('operação desconhecida, valores adulterados e ID inválido não são salvos',async()=>{
 for(const a of [{...action,action:'admin.grant'},{...action,payload:{...action.payload,amount:-1}},{...action,companyId:'anything?or=owner'}]){const f=fixture();await assert.rejects(f.service.run('action','POST','Bearer valid',a),{status:400});assert.ok(!f.calls.some(c=>c.path.includes('stockzap_save_state')));}
});
test('gravação usa ator autenticado e cálculo do servidor, sem aceitar estado do cliente',async()=>{
 const f=fixture();const result=await f.service.run('action','POST','Bearer valid',{...action,p_actor:'forged',state:{company:{owner:'injected'}}});
 assert.equal(result.state.transactions[0].amount,10);const call=f.calls.find(c=>c.path.includes('stockzap_save_state'));assert.equal(call.body.p_actor,user.id);assert.equal(call.body.p_revision,1);assert.equal(call.body.p_state.revision,2);
});
test('limitação de chamadas impede operações adicionais',async()=>{
 const f=fixture({limit:false});await assert.rejects(f.service.run('state','GET','Bearer valid',{companyId:company}),{status:429});assert.ok(!f.calls.some(c=>c.path.includes('stockzap_states')));
});
test('aceite exige versão atual e registra apenas o usuário autenticado',async()=>{
 const f=fixture();await assert.rejects(f.service.run('legal-accept','POST','Bearer valid',{version:'old'}),{status:400});await f.service.run('legal-accept','POST','Bearer valid',{version:'2026-10-19',user_id:'forged'});
 const inserted=f.calls.find(c=>c.path.endsWith('stockzap_legal_acceptances')&&c.method==='POST');assert.equal(inserted.body.user_id,user.id);assert.equal(inserted.body.version,'2026-10-19');
});
test('solicitação de privacidade devolve protocolo sem executar exclusão',async()=>{
 const f=fixture();const result=await f.service.run('privacy-request','POST','Bearer valid',{kind:'deletion',details:'Teste',user_id:'forged'});assert.equal(result.request.status,'pending');assert.ok(!f.calls.some(c=>c.method==='DELETE'));const write=f.calls.find(c=>c.path.endsWith('stockzap_privacy_requests')&&c.method==='POST');assert.equal(write.body.user_id,user.id);
});
test('descrição excessiva e tipo inválido de privacidade são rejeitados',async()=>{
 for(const body of [{kind:'deletion',details:'a'.repeat(1001)},{kind:'grant-admin',details:''}]){const f=fixture();await assert.rejects(f.service.run('privacy-request','POST','Bearer valid',body),{status:400});}
});
