'use strict';
let verificando=false;
async function verificarSessao(){
 if(verificando)return;verificando=true;
 const titulo=document.getElementById('titulo'),mensagem=document.getElementById('mensagem'),botao=document.getElementById('botaoReenviar');
 botao.style.display='none';
 try{
  const {data,error}=await stockzapSupabase.auth.getUser();
  if(error&&error.name!=='AuthSessionMissingError')throw error;
  if(!data?.user){
   titulo.textContent='Confirme seu e-mail para continuar';
   mensagem.textContent='Abra o link de confirmação recebido e depois entre na sua conta. O questionário aparecerá antes do primeiro acesso ao painel.';
   botao.style.display='inline-block';return;
  }
  titulo.textContent='Preparando sua experiência…';
  const config=await StockZapOnboardingService.load(stockzapSupabase,data.user,localStorage);
  window.location.replace(config?'../funcionalidades_internas/dashboard.html':'zapchat.html');
 }catch(_){titulo.textContent='Não foi possível verificar sua conta';mensagem.textContent='Confira sua conexão e tente novamente.';botao.style.display='inline-block';}
 finally{verificando=false;}
}
document.addEventListener('DOMContentLoaded',()=>{
 verificarSessao();
 // Executa fora do callback do Auth para evitar chamadas encadeadas dentro dele.
 stockzapSupabase.auth.onAuthStateChange(event=>{if(event==='SIGNED_IN')setTimeout(verificarSessao,0);});
});
