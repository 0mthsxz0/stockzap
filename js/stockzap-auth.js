(function(root){
  'use strict';
  const url='https://xvbryihihhzehebchuqc.supabase.co';
  const publicKey='sb_publishable_J9mO9NOyEva7VwReeRr-_A_CiUmaCdO';
  const api=url+'/functions/v1/stockzap-api';
  const version='2026-10-19';let instance;
  function client(){
    if(!instance){
      if(!root.supabase)throw new Error('Não foi possível carregar a autenticação. Recarregue a página.');
      instance=root.supabase.createClient(url,publicKey,{auth:{flowType:'pkce',persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,storageKey:'stockzap:auth:v2'}});
    }
    return instance;
  }
  async function user(){
    const {data,error}=await client().auth.getUser();
    if(error||!data?.user){const error=new Error('Entre na sua conta para continuar.');error.status=401;throw error;}
    return data.user;
  }
  async function request(path,{method='GET',body,companyId}={}){
    const {data,error}=await client().auth.getSession();
    if(error||!data?.session){const err=new Error('Sua sessão terminou. Entre novamente.');err.status=401;throw err;}
    const target=api+'/'+path+(companyId?'?companyId='+encodeURIComponent(companyId):'');
    let response;
    try{response=await fetch(target,{method,headers:{apikey:publicKey,Authorization:'Bearer '+data.session.access_token,...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,cache:'no-store',credentials:'omit',signal:AbortSignal.timeout(20000)});}
    catch{throw new Error('Não foi possível conectar. Confira sua conexão e tente novamente.');}
    const result=await response.json().catch(()=>null);
    if(!response.ok){const err=new Error(result?.error||'Não foi possível concluir a operação.');err.status=response.status;err.state=result?.state;throw err;}
    if(!result)throw new Error('O serviço retornou uma resposta inválida.');
    return result;
  }
  async function logout(){const {error}=await client().auth.signOut();if(error)throw new Error('Não foi possível sair. Tente novamente.');}
  function authMessage(error){
    if(error?.status===429)return 'Muitas tentativas. Aguarde um pouco antes de tentar novamente.';
    if(/fetch|network|timeout/i.test(error?.message||''))return 'Confira a conexão e tente novamente.';
    return 'Não foi possível concluir. Confira os dados e, se necessário, recupere sua senha ou confirme seu e-mail.';
  }
  root.StockZapAuth=Object.freeze({client,user,request,logout,authMessage,version});
})(window);
