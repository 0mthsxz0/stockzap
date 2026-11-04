(function(root){
  'use strict';
  const script=document.currentScript;
  const base=script?.src?new URL('../',script.src):new URL('./',location.href);
  function url(path=''){return new URL(String(path).replace(/^\/+/,''),base).href;}
  let overlay=null,previousFocus=null;
  function loading(message){
    if(!overlay){
      previousFocus=document.activeElement;overlay=document.createElement('div');overlay.className='connection-loading';overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');overlay.tabIndex=-1;
      const card=document.createElement('div');card.className='connection-loading-card';
      const logo=document.createElement('img');logo.src=url('imagens/StockZap_logo.svg');logo.alt='StockZap';logo.width=151;logo.height=40;
      const spinner=document.createElement('span');spinner.className='connection-spinner';spinner.setAttribute('aria-hidden','true');
      const title=document.createElement('h2');title.textContent='Conectando ao seu negócio';
      const text=document.createElement('p');text.dataset.loadingMessage='';
      const hint=document.createElement('small');hint.textContent='Isso pode levar alguns instantes. Aguarde enquanto verificamos seu acesso.';
      card.append(logo,spinner,title,text,hint);overlay.append(card);document.body.append(overlay);document.body.setAttribute('aria-busy','true');overlay.focus();
    }
    overlay.querySelector('[data-loading-message]').textContent=message;
  }
  function loaded(){if(!overlay)return;overlay.remove();overlay=null;document.body.removeAttribute('aria-busy');if(previousFocus?.isConnected)previousFocus.focus({preventScroll:true});previousFocus=null;}
  // Restore the form if the browser returns from the dashboard via back/forward cache.
  root.addEventListener?.('pageshow',event=>{if(event.persisted)loaded();});
  root.StockZapSite=Object.freeze({base:base.href,url,loading,loaded});
})(window);

