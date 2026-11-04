'use strict';
const formLogin=document.getElementById('formLogin');
formLogin.addEventListener('submit',async evento=>{
 evento.preventDefault();const button=formLogin.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const {error}=await stockzapSupabase.auth.signInWithPassword({email:document.getElementById('email').value.trim(),password:document.getElementById('senha').value});
  if(error){alert('Não foi possível entrar. Confira e-mail, senha e confirmação de e-mail.');return;}
  window.location.replace('autenticando.html');
 }catch(_){alert('Não foi possível conectar. Tente novamente.');}
 finally{button.disabled=false;}
});
