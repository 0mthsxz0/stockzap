import {Core as C} from './core.mjs';
import {Care} from './zapcare.mjs';
import {today,emptyWorkspace} from './workspace.mjs';

export class HttpError extends Error {
  constructor(status,message,extra={}) { super(message);this.status=status;Object.assign(this,extra); }
}
const uuid=value=>typeof value==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
const text=(v,label,max=140)=>{
  if(typeof v!=='string'||!v.trim()||v.trim().length>max)throw new HttpError(400,label+': preencha até '+max+' caracteres.');
  return v.trim();
};
const plain=v=>v!==null&&typeof v==='object'&&!Array.isArray(v);
const allowedActions=new Set(['product.save','product.archive','stock.move','supplier.save','customer.save','order.create','order.status','transaction.create','transaction.pay','task.save','task.toggle','team.save','company.save','onboarding.save']);
const adminActions=new Set(['team.save','company.save','onboarding.save']);
export function createService({env={},fetcher=fetch}={}) {
  const url=env.SUPABASE_URL,publicKey=env.SUPABASE_PUBLISHABLE_KEY||env.SUPABASE_ANON_KEY,secret=env.SUPABASE_SECRET_KEY||env.SUPABASE_SERVICE_ROLE_KEY;
  if(!url||!publicKey||!secret)throw new HttpError(503,'Configuração do serviço incompleta.');
  async function sb(path,{method='GET',body,token,privileged=false,prefer}={}) {
    const key=privileged?secret:publicKey;
    let response;
    try {response=await fetcher(url+path,{method,headers:{apikey:key,...(privileged&&key.startsWith('eyJ')?{Authorization:'Bearer '+key}:{}),...(token?{Authorization:'Bearer '+token}:{}),...(body!==undefined?{'Content-Type':'application/json'}:{}),...(prefer?{Prefer:prefer}:{})},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(15000)});}
    catch {throw new HttpError(503,'Não foi possível conectar ao banco. Tente novamente.');}
    const data=await response.json().catch(()=>null);
    if(!response.ok){
      if(path.startsWith('/auth/'))throw new HttpError(401,'Sua sessão expirou. Entre novamente.');
      if(response.status===409)throw new HttpError(409,'Os dados mudaram. Atualize e tente novamente.');
      const message=data?.message||'';
      if(/Not authorized|Only owner/.test(message))throw new HttpError(403,'Seu acesso não permite esta alteração.');
      if(/already a member/.test(message))throw new HttpError(400,'Este e-mail já tem acesso à empresa.');
      if(/Invite expired|Confirm and use/.test(message))throw new HttpError(400,'Convite inválido, expirado ou destinado a outro e-mail.');
      if(/limit reached/i.test(message))throw new HttpError(400,'O limite do MVP foi alcançado para esta operação.');
      console.error('StockZap database failure',response.status,path.split('?')[0],data?.code);
      throw new HttpError(503,'Não foi possível concluir a operação no banco. Tente novamente.',{reference:data?.code||String(response.status)});
    }
    return data;
  }
  const rpc=(name,body)=>sb('/rest/v1/rpc/'+name,{method:'POST',body,privileged:true});
  async function identify(authorization){
    const token=/^Bearer ([^\s]+)$/.exec(authorization||'')?.[1];
    if(!token)throw new HttpError(401,'Entre na sua conta para continuar.');
    const user=await sb('/auth/v1/user',{token});
    if(!user?.id||!user.email)throw new HttpError(401,'Sessão inválida.');
    if(!await rpc('stockzap_allow_request',{p_actor:user.id}))throw new HttpError(429,'Muitas operações em um minuto. Aguarde um pouco e tente novamente.');
    return {user,token};
  }
  async function companyFor(companyId,user,token){
    if(!uuid(companyId))throw new HttpError(400,'Selecione uma empresa válida.');
    const rows=await sb('/rest/v1/stockzap_members?company_id=eq.'+companyId+'&user_id=eq.'+user.id+'&select=role',{token});
    if(!rows.length)throw new HttpError(403,'Você não tem acesso a esta empresa.');
    return rows[0].role;
  }
  async function load(companyId,token){
    const rows=await sb('/rest/v1/stockzap_states?company_id=eq.'+companyId+'&select=state,revision',{token});
    if(!rows[0]?.state)throw new HttpError(404,'Empresa não encontrada.');
    return {...rows[0].state,asOf:today()};
  }
  async function digest(token){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(token)))).map(v=>v.toString(16).padStart(2,'0')).join('');}
  function recentOtp(token){
    try {const claim=JSON.parse(atob(token.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));return Array.isArray(claim.amr)&&claim.amr.some(a=>a.method==='otp'&&Number.isFinite(a.timestamp)&&a.timestamp>Date.now()/1000-900);}
    catch {return false;}
  }
  return {async run(path,method,authorization,body={}){
    if(path==='config'&&method==='GET')return {enabled:true,url,publicKey,version:'2.0.0'};
    const {user,token}=await identify(authorization);
    const legalVersion='2026-10-19';
    if(path==='legal-status'&&method==='GET'){
      const rows=await sb('/rest/v1/stockzap_legal_acceptances?user_id=eq.'+user.id+'&version=eq.'+legalVersion+'&select=version,accepted_at',{token});
      return {accepted:Boolean(rows.length),version:legalVersion};
    }
    if(path==='legal-accept'&&method==='POST'){
      if(body.version!==legalVersion)throw new HttpError(400,'Leia a versão atual dos termos e da política.');
      await sb('/rest/v1/stockzap_legal_acceptances',{method:'POST',privileged:true,body:{user_id:user.id,version:legalVersion},prefer:'resolution=ignore-duplicates'});
      return {accepted:true,version:legalVersion};
    }
    if(path==='privacy-export'&&method==='GET'){
      const profile=await sb('/rest/v1/stockzap_profiles?id=eq.'+user.id+'&select=id,name,email,phone,created_at,updated_at',{token});
      const memberships=await sb('/rest/v1/stockzap_members?user_id=eq.'+user.id+'&select=company_id,role,joined_at',{token});
      const requests=await sb('/rest/v1/stockzap_privacy_requests?user_id=eq.'+user.id+'&select=id,kind,details,status,response,created_at,updated_at&order=created_at.desc',{token});
      const acceptances=await sb('/rest/v1/stockzap_legal_acceptances?user_id=eq.'+user.id+'&select=version,accepted_at',{token});
      return {exportedAt:new Date().toISOString(),account:{id:user.id,email:user.email,createdAt:user.created_at},profile:profile[0],memberships,requests,acceptances};
    }
    if(path==='privacy-history'&&method==='GET')return {requests:await sb('/rest/v1/stockzap_privacy_requests?user_id=eq.'+user.id+'&select=id,kind,status,response,created_at,updated_at&order=created_at.desc&limit=50',{token})};
    if(path==='privacy-request'&&method==='POST'){
      if(!['access','correction','deletion','objection','other'].includes(body.kind))throw new HttpError(400,'Escolha o direito que deseja exercer.');
      const details=body.details===undefined?'':body.details;
      if(typeof details!=='string'||details.length>1000)throw new HttpError(400,'Use até 1.000 caracteres na descrição.');
      const recent=await sb('/rest/v1/stockzap_privacy_requests?user_id=eq.'+user.id+'&created_at=gte.'+encodeURIComponent(new Date(Date.now()-86400000).toISOString())+'&select=id&limit=5',{token});
      if(recent.length>=5)throw new HttpError(429,'Você já registrou cinco pedidos nas últimas 24 horas. Consulte seus protocolos ou tente novamente depois.');
      const rows=await sb('/rest/v1/stockzap_privacy_requests',{method:'POST',privileged:true,body:{user_id:user.id,kind:body.kind,details:details.trim()},prefer:'return=representation'});
      return {request:{id:rows[0].id,kind:rows[0].kind,status:rows[0].status,created_at:rows[0].created_at}};
    }
    if(path==='companies'&&method==='GET'){
      let rows=await sb('/rest/v1/stockzap_members?user_id=eq.'+user.id+'&select=company_id,role,joined_at,stockzap_companies(id,name)&order=joined_at.asc',{token});
      if(!rows.length){const state=emptyWorkspace(user);await rpc('stockzap_create_company',{p_actor:user.id,p_name:state.company.name,p_state:state,p_default:true});rows=await sb('/rest/v1/stockzap_members?user_id=eq.'+user.id+'&select=company_id,role,joined_at,stockzap_companies(id,name)&order=joined_at.asc',{token});}
      const profile=await sb('/rest/v1/stockzap_profiles?id=eq.'+user.id+'&select=id,name,email,phone',{token});
      return {companies:rows.map(r=>({id:r.company_id,name:r.stockzap_companies.name,role:r.role})),profile:profile[0]};
    }
    if(path==='company-create'&&method==='POST'){
      const name=text(body.name,'Nome da empresa');const state=emptyWorkspace(user,name);
      const companyId=await rpc('stockzap_create_company',{p_actor:user.id,p_name:name,p_state:state,p_default:false});
      return {companyId,state};
    }
    if(path==='profile'&&method==='POST'){
      const name=text(body.name,'Nome'),phone=body.phone?text(body.phone,'Telefone',40):'';
      const rows=await sb('/rest/v1/stockzap_profiles?id=eq.'+user.id,{method:'PATCH',token,body:{name,phone},prefer:'return=representation'});
      if(!rows?.length)throw new HttpError(403,'Não foi possível atualizar seu perfil.');
      return {profile:rows[0]};
    }
    if(path==='invite-accept'&&method==='POST'){
      const invite=text(body.token,'Convite',100);
      // An OTP session proves possession of the invited email even if Auth auto-confirm is on.
      if(!recentOtp(token))throw new HttpError(428,'Confirme seu e-mail com o código para aceitar este convite.',{needsOtp:true});
      const companyId=await rpc('stockzap_accept_invite',{p_actor:user.id,p_hash:await digest(invite)});
      return {companyId};
    }
    const companyId=body.companyId;const role=await companyFor(companyId,user,token);
    if(path==='state'&&method==='GET')return {state:await load(companyId,token),companyId,role,mode:'cloud',aiEnabled:false};
    if(path==='action'&&method==='POST'){
      if(role==='viewer'||(adminActions.has(body.action)&&!['owner','admin'].includes(role)))throw new HttpError(403,'Seu acesso não permite esta alteração.');
      if(!allowedActions.has(body.action)||!plain(body.payload))throw new HttpError(400,'Operação inválida.');
      const state=await load(companyId,token);
      if(!Number.isSafeInteger(body.revision)||body.revision!==state.revision)throw new HttpError(409,'Os dados mudaram em outra aba. Revise e tente novamente.',{state});
      let next;
      try {
        if(body.action==='onboarding.save'){
          if(JSON.stringify(body.payload).length>4000)throw new Error('Respostas muito longas.');
          next={...state,onboarding:body.payload,revision:state.revision+1};
        }else next=C.mutate(state,body.action,body.payload);
      }catch(e){throw new HttpError(400,e.message);}
      if(next.activity[0]&&next.activity[0].id!==state.activity[0]?.id){next.activity[0].actorId=user.id;next.activity[0].actorName=user.user_metadata?.nome||user.user_metadata?.name||user.email;}
      if(new TextEncoder().encode(JSON.stringify(next)).length>3500000)throw new HttpError(413,'Limite de dados do MVP alcançado. Exporte os registros antes de continuar.');
      const saved=await rpc('stockzap_save_state',{p_company:companyId,p_actor:user.id,p_revision:state.revision,p_state:next,p_action:body.action});
      if(!saved)throw new HttpError(409,'Outra operação foi salva antes. Revise os dados e tente novamente.',{state:await load(companyId,token)});
      return {state:next};
    }
    if(path==='zapcare'&&method==='POST'){
      const message=text(body.message,'Pergunta',3000),state=await load(companyId,token);
      const history=Array.isArray(body.history)?body.history.filter(h=>plain(h)&&['user','assistant'].includes(h.role)&&typeof h.content==='string').slice(-10):[];
      return Care.answer(state,message,history);
    }
    if(path==='members'&&method==='GET'){
      const members=await sb('/rest/v1/stockzap_members?company_id=eq.'+companyId+'&select=user_id,role,joined_at&order=joined_at.asc',{token});
      const ids=members.map(m=>m.user_id).join(',');
      const profiles=ids?await sb('/rest/v1/stockzap_profiles?id=in.('+ids+')&select=id,name,email',{token}):[];
      const invites=['owner','admin'].includes(role)?await sb('/rest/v1/stockzap_invites?company_id=eq.'+companyId+'&select=id,email,role,expires_at,accepted_at,revoked_at&order=created_at.desc&limit=50',{token}):[];
      return {members:members.map(m=>({...m,profile:profiles.find(p=>p.id===m.user_id)})),invites};
    }
    if(path==='invite-create'&&method==='POST'){
      if(!['owner','admin'].includes(role))throw new HttpError(403,'Apenas administradores podem convidar pessoas.');
      const email=text(body.email,'E-mail',254).toLowerCase();
      if(!['admin','operator','viewer'].includes(body.role))throw new HttpError(400,'Escolha um acesso válido.');
      const raw=crypto.randomUUID().replace(/-/g,'')+crypto.randomUUID().replace(/-/g,'');
      const id=await rpc('stockzap_issue_invite',{p_company:companyId,p_actor:user.id,p_email:email,p_role:body.role,p_hash:await digest(raw)});
      return {inviteId:id,token:raw};
    }
    if(path==='member-update'&&method==='POST'){
      if(!uuid(body.userId)||!['role','remove'].includes(body.operation))throw new HttpError(400,'Escolha um membro e uma alteração válidos.');
      await rpc('stockzap_manage_member',{p_company:companyId,p_actor:user.id,p_target:body.userId,p_operation:body.operation,p_role:body.role||null});return {saved:true};
    }
    if(path==='invite-revoke'&&method==='POST'){
      if(!uuid(body.inviteId))throw new HttpError(400,'Convite inválido.');
      await rpc('stockzap_revoke_invite',{p_company:companyId,p_actor:user.id,p_invite:body.inviteId});return {saved:true};
    }
    if(path==='audit'&&method==='GET'){
      if(!['owner','admin'].includes(role))throw new HttpError(403,'Apenas administradores podem consultar este histórico.');
      return {events:await sb('/rest/v1/stockzap_audit?company_id=eq.'+companyId+'&select=id,actor_id,action,details,created_at&order=created_at.desc&limit=100',{token})};
    }
    throw new HttpError(404,'Operação não encontrada.');
  }};
}

