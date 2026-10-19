(function(root){
  'use strict';
  const settings=root.STOCKZAP_CONFIG||{},url=String(settings.supabaseUrl||'').replace(/\/$/,''),publicKey=settings.supabasePublishableKey||'',api=settings.apiUrl||url+'/functions/v1/stockzap-api';
  const version=settings.termsVersion||'2026-10-19';let instance;
  function failure(message,status,code){return Object.assign(new Error(message),{status,code});}
  function checkEnvironment(){
    if(!/^https?:$/.test(location.protocol))throw failure('Para entrar ou criar uma conta, abra a StockZap em um endereço HTTP ou HTTPS. Inicie o servidor do projeto e abra o link exibido.',0,'web_server_required');
    if(!/^https:\/\//.test(url)||!publicKey.startsWith('sb_publishable_'))throw failure('A conexão com a StockZap não foi configurada nesta publicação.',0,'configuration_missing');
    try{const key='stockzap:storage-check';localStorage.setItem(key,'1');localStorage.removeItem(key);}catch{throw failure('Seu navegador bloqueou os dados necessários para manter o login. Permita o armazenamento deste site e tente novamente.',0,'storage_unavailable');}
  }
  function client(){
    if(!instance){
      checkEnvironment();if(!root.supabase)throw failure('A autenticação não carregou nesta página. Recarregue para tentar novamente.',0,'sdk_missing');
      const transport=(input,options={})=>fetch(input,{...options,credentials:'omit',signal:options.signal||AbortSignal.timeout(15000)});
      instance=root.supabase.createClient(url,publicKey,{global:{fetch:transport},auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'stockzap:auth:v2'}});
    }
    return instance;
  }
  async function health(){
    checkEnvironment();let response;
    try{response=await fetch(api+'/health',{headers:{apikey:publicKey},credentials:'omit',cache:'no-store',signal:AbortSignal.timeout(12000)});}catch{throw failure('Não foi possível conectar ao serviço de gestão. Confira sua conexão e tente novamente.',503,'api_unreachable');}
    const result=await response.json().catch(()=>null);
    if(result?.originAllowed===false)throw failure('Este endereço ainda não está autorizado a acessar a gestão. A publicação precisa ter seu domínio configurado.',403,'origin_not_allowed');
    if(!response.ok||result?.status!=='ok')throw failure('O serviço de gestão está indisponível nesta publicação. Tente novamente em alguns instantes.',503,'api_unavailable');
    return result;
  }
  async function user(){
    const {data,error}=await client().auth.getUser();
    if(error){
      if([400,401,403].includes(error.status))throw failure('Entre na sua conta para continuar.',401,'session_missing');
      throw failure('Não foi possível verificar sua sessão. Confira a conexão e tente novamente.',503,'auth_unavailable');
    }
    if(!data?.user)throw failure('Entre na sua conta para continuar.',401,'session_missing');return data.user;
  }
  async function request(path,{method='GET',body,companyId}={}){
    const {data,error}=await client().auth.getSession();
    if(error)throw failure(authMessage(error),error.status>=500?503:401,error.code);
    if(!data?.session)throw failure('Sua sessão terminou. Entre novamente.',401,'session_missing');
    const target=api+'/'+path+(companyId?'?companyId='+encodeURIComponent(companyId):'');let response;
    try{response=await fetch(target,{method,headers:{apikey:publicKey,Authorization:'Bearer '+data.session.access_token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});}
    catch{throw failure('Não foi possível conectar ao serviço de gestão. Confira sua conexão e tente novamente.',503,'api_unreachable');}
    const result=await response.json().catch(()=>null);
    if(!response.ok){const err=failure(result?.error||'Não foi possível concluir a operação.',response.status);err.state=result?.state;throw err;}
    if(!result)throw failure('O serviço retornou uma resposta inválida.',503,'invalid_response');return result;
  }
  async function logout(){const {error}=await client().auth.signOut();if(error)throw failure('Não foi possível sair. Tente novamente.',503,'logout_failed');}
  function authMessage(error){
    if(['web_server_required','storage_unavailable','configuration_missing','sdk_missing','api_unreachable','api_unavailable','auth_unavailable','origin_not_allowed'].includes(error?.code))return error.message;
    if(error?.code==='invalid_credentials')return 'E-mail ou senha incorretos. Confira os dados ou use “Esqueci minha senha”.';
    if(error?.code==='email_not_confirmed')return 'Confirme seu e-mail antes de entrar. Confira também a pasta de spam.';
    if(error?.code==='weak_password')return 'A senha foi recusada. Use uma senha mais longa e difícil de adivinhar.';
    if(error?.code==='signup_disabled')return 'A criação de contas está temporariamente indisponível.';
    if(error?.status===429||/rate.limit|too.many/i.test(error?.code||''))return 'Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.';
    if(/fetch|network|timeout|abort/i.test(error?.message||''))return 'Não foi possível conectar à autenticação. Confira a conexão e tente novamente.';
    return 'Não foi possível concluir. Confira os dados e, se necessário, recupere sua senha ou confirme seu e-mail.';
  }
  root.StockZapAuth=Object.freeze({client,user,request,logout,health,authMessage,version});
})(window);
