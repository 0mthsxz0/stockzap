'use strict';
const formCadastro=document.getElementById('formCadastro');
formCadastro.addEventListener('submit',async evento=>{
 evento.preventDefault();const button=formCadastro.querySelector('button[type="submit"]');button.disabled=true;
 try{
  const nome=document.getElementById('nome_user').value.trim(),empresa=document.getElementById('nome_empresa').value.trim();
  if(!nome||!empresa||nome.length>120||empresa.length>160){alert('Preencha seu nome e o nome da empresa dentro dos limites.');return;}
  const {error}=await stockzapSupabase.auth.signUp({email:document.getElementById('email').value.trim(),password:document.getElementById('senha').value,options:{emailRedirectTo:new URL('autenticando.html',window.location.href).href,data:{nome,empresa}}});
  if(error){alert('Não foi possível criar sua conta. Confira os campos e tente novamente.');return;}
  // Tabelas legadas usuario/empresa estão desativadas; o Auth guarda os dados do cadastro.
  window.location.replace('autenticando.html');
 }catch(_){alert('Não foi possível conectar. Tente novamente.');}
 finally{button.disabled=false;}
});
