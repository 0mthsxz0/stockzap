(function(){
  'use strict';
  const A=window.StockZapAuth,form=document.querySelector('[data-auth-form]'),message=document.querySelector('[data-auth-message]');
  const show=(text,error=false)=>{message.textContent=text;message.hidden=false;message.classList.toggle('error',error);message.setAttribute('role',error?'alert':'status');};
  const site=window.StockZapSite,callback=flow=>site.url('auth/callback.html')+(flow?'?flow='+flow:'');
  if(document.body.dataset.page!=='callback')site.arrive?.();
  document.querySelector('[data-toggle-password]')?.addEventListener('click',event=>{
    const input=document.getElementById('senha'),visible=input.type==='password';input.type=visible?'text':'password';event.currentTarget.textContent=visible?'Ocultar':'Mostrar';event.currentTarget.setAttribute('aria-pressed',String(visible));
  });
  const attemptsKey='stockzap:login-attempts:v1',cooldown=15*60*1000;
  let memory={errors:0,until:0},submitting=false;
  function attempts(){
    try{const saved=JSON.parse(localStorage.getItem(attemptsKey));if(saved&&Number.isInteger(saved.errors)&&saved.errors>=0&&Number.isFinite(saved.until)&&saved.until>=0)memory=saved;}catch{}
    if(memory.until&&memory.until<=Date.now()){memory={errors:0,until:0};saveAttempts();}
    return memory;
  }
  function saveAttempts(){try{localStorage.setItem(attemptsKey,JSON.stringify(memory));}catch{}}
  function blocked(){const state=attempts();if(state.until>Date.now()){show('Limite de 5 erros atingido. Tente novamente em '+Math.ceil((state.until-Date.now())/60000)+' minuto(s).',true);return true;}return false;}
  document.querySelector('[data-google-login]')?.addEventListener('click',async event=>{
    const button=event.currentTarget;button.disabled=true;
    try{const {error}=await A.client().auth.signInWithOAuth({provider:'google',options:{redirectTo:callback()}});if(error)throw error;}
    catch(error){show(A.authMessage(error),true);}
    finally{button.disabled=false;}
  });
  form?.addEventListener('submit',async event=>{
    event.preventDefault();if(submitting||!form.reportValidity())return;
    if(form.dataset.authForm==='login'&&blocked())return;
    submitting=true;
    const values=Object.fromEntries(new FormData(form)),button=form.querySelector('[type=submit]'),label=button.textContent;
    let navigating=false;
    button.disabled=true;button.textContent='Aguarde…';message.hidden=true;
    if(['login','cadastro'].includes(form.dataset.authForm))site.loading('Verificando a conexão com a StockZap…');
    try{
      const c=A.client(),kind=form.dataset.authForm;
      if(kind==='login'||kind==='cadastro')await A.health();
      if(kind==='login'){
        site.loading('Validando seu e-mail e senha…');
        const {error}=await c.auth.signInWithPassword({email:values.email.trim(),password:values.senha});if(error){
          if(error.code==='invalid_credentials'){
            attempts();memory.errors++;if(memory.errors>=5)memory.until=Date.now()+cooldown;saveAttempts();
            if(blocked())return;
            show(A.authMessage(error)+' Restam '+(5-memory.errors)+' tentativa(s).',true);return;
          }
          throw error;
        }
        memory={errors:0,until:0};saveAttempts();
        button.textContent='Abrindo seu espaço…';site.loading('Login confirmado. Abrindo seu espaço…');await A.user();form.reset();navigating=true;site.handoff?.();location.replace(site.url('app.html'));
      }else if(kind==='cadastro'){
        if(values.senha!==values.confirmar)throw new Error('As senhas precisam ser iguais.');
        if(values.senha.length<6||values.senha.length>128)throw new Error('Use uma senha entre 6 e 128 caracteres.');
        const {data,error}=await c.auth.signUp({email:values.email.trim(),password:values.senha,options:{emailRedirectTo:callback(),data:{nome:values.nome.trim(),empresa:values.empresa.trim(),terms_version:A.version}}});
        if(error)throw error;
        form.reset();
        if(data.session){site.loading('Conta criada. Abrindo seu espaço…');navigating=true;site.handoff?.();location.replace(site.url('app.html'));}
        else show('Se o endereço puder receber um cadastro, você receberá um e-mail de confirmação. Confira também o spam e depois entre na sua conta.');
      }else if(kind==='recuperar'){
        const {error}=await c.auth.resetPasswordForEmail(values.email.trim(),{redirectTo:callback('recovery')});if(error)throw error;
        form.reset();show('Se existir uma conta para esse e-mail, você receberá as instruções para redefinir a senha.');
      }else if(kind==='redefinir'){
        if(values.senha!==values.confirmar)throw new Error('As senhas precisam ser iguais.');
        if(values.senha.length<6)throw new Error('Use pelo menos 6 caracteres.');
        await A.user();const {error}=await c.auth.updateUser({password:values.senha});if(error)throw error;
        const {error:signoutError}=await c.auth.signOut();if(signoutError)throw signoutError;
        form.reset();show('Senha atualizada. Entre novamente com a nova senha.');
        const link=document.createElement('a');link.href=site.url('login.html');link.className='button primary';link.textContent='Ir para o login';message.append(document.createElement('br'),link);
      }
    }catch(error){show(/Use |senhas precisam/.test(error.message)?error.message:A.authMessage(error),true);}
    finally{submitting=false;if(!navigating)site.loaded();button.disabled=false;button.textContent=label;}
  });
  if(document.body.dataset.page==='callback'){
    (async()=>{
      site.loading('Confirmando seu acesso…');
      try{
        const recovery=new URLSearchParams(location.search).get('flow')==='recovery';
        await A.user();history.replaceState(null,'',location.pathname);
        site.handoff?.();location.replace(site.url(recovery?'redefinir-senha.html':'app.html'));
      }catch(error){history.replaceState(null,'',location.pathname);show(error.status===503?A.authMessage(error):'O link expirou ou foi aberto em outro navegador. Solicite um novo link e abra no navegador em que iniciou o processo.',true);site.loaded();}
    })();
  }
})();

