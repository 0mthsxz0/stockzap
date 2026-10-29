(function(){
  'use strict';
  const A=window.StockZapAuth,form=document.querySelector('[data-auth-form]'),message=document.querySelector('[data-auth-message]');
  const show=(text,error=false)=>{message.textContent=text;message.hidden=false;message.classList.toggle('error',error);message.setAttribute('role',error?'alert':'status');};
  const site=window.StockZapSite,callback=flow=>site.url('auth/callback.html')+(flow?'?flow='+flow:'');
  document.querySelector('[data-toggle-password]')?.addEventListener('click',event=>{
    const input=document.getElementById('senha'),visible=input.type==='password';input.type=visible?'text':'password';event.currentTarget.textContent=visible?'Ocultar':'Mostrar';event.currentTarget.setAttribute('aria-pressed',String(visible));
  });
  form?.addEventListener('submit',async event=>{
    event.preventDefault();if(!form.reportValidity())return;
    const values=Object.fromEntries(new FormData(form)),button=form.querySelector('[type=submit]'),label=button.textContent;
    button.disabled=true;button.textContent='Aguarde…';message.hidden=true;
    try{
      const c=A.client(),kind=form.dataset.authForm;
      if(kind==='login'||kind==='cadastro')await A.health();
      if(kind==='login'){
        const {error}=await c.auth.signInWithPassword({email:values.email.trim(),password:values.senha});if(error)throw error;
        button.textContent='Abrindo seu espaço…';await A.user();form.reset();location.replace(site.url('app.html'));
      }else if(kind==='cadastro'){
        if(values.senha.length<12||values.senha.length>128)throw new Error('Use uma senha entre 12 e 128 caracteres.');
        const {data,error}=await c.auth.signUp({email:values.email.trim(),password:values.senha,options:{emailRedirectTo:callback(),data:{nome:values.nome.trim(),empresa:values.empresa.trim(),terms_version:A.version}}});
        if(error)throw error;
        form.reset();
        if(data.session)location.replace(site.url('app.html'));
        else show('Se o endereço puder receber um cadastro, você receberá um e-mail de confirmação. Confira também o spam e depois entre na sua conta.');
      }else if(kind==='recuperar'){
        const {error}=await c.auth.resetPasswordForEmail(values.email.trim(),{redirectTo:callback('recovery')});if(error)throw error;
        form.reset();show('Se existir uma conta para esse e-mail, você receberá as instruções para redefinir a senha.');
      }else if(kind==='redefinir'){
        if(values.senha!==values.confirmar)throw new Error('As senhas precisam ser iguais.');
        if(values.senha.length<12)throw new Error('Use pelo menos 12 caracteres.');
        await A.user();const {error}=await c.auth.updateUser({password:values.senha});if(error)throw error;
        const {error:signoutError}=await c.auth.signOut();if(signoutError)throw signoutError;
        form.reset();show('Senha atualizada. Entre novamente com a nova senha.');
        const link=document.createElement('a');link.href=site.url('login.html');link.className='button primary';link.textContent='Ir para o login';message.append(document.createElement('br'),link);
      }
    }catch(error){show(/Use |senhas precisam/.test(error.message)?error.message:A.authMessage(error),true);}
    finally{button.disabled=false;button.textContent=label;}
  });
  if(document.body.dataset.page==='callback'){
    (async()=>{
      try{
        const recovery=new URLSearchParams(location.search).get('flow')==='recovery';
        await A.user();history.replaceState(null,'',location.pathname);
        location.replace(site.url(recovery?'redefinir-senha.html':'app.html'));
      }catch(error){history.replaceState(null,'',location.pathname);show(error.status===503?A.authMessage(error):'O link expirou ou foi aberto em outro navegador. Solicite um novo link e abra no navegador em que iniciou o processo.',true);}
    })();
  }
})();
