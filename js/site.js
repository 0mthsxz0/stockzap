(function(root){
  'use strict';
  const script=document.currentScript;
  const base=script?.src?new URL('../',script.src):new URL('./',location.href);
  function url(path=''){return new URL(String(path).replace(/^\/+/,''),base).href;}
  const motion={strike:560,reveal:650,reduced:150};
  let overlay=null,previousFocus=null,startedAt=0,revealTimer,removeTimer;
  const reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches===true;
  function cancelReveal(){clearTimeout(revealTimer);clearTimeout(removeTimer);}
  function handoff(){try{sessionStorage.setItem('stockzap:loading-handoff',String(Date.now()));}catch{}}
  function consumeHandoff(){
    try{const value=Number(sessionStorage.getItem('stockzap:loading-handoff'));sessionStorage.removeItem('stockzap:loading-handoff');return value>0&&Date.now()-value>=0&&Date.now()-value<30000;}catch{return false;}
  }
  function loading(message){
    cancelReveal();
    if(!overlay){
      const arrived=consumeHandoff();startedAt=Date.now()-(arrived?motion.strike:0);
      previousFocus=document.activeElement;overlay=document.createElement('div');overlay.className='zap-transition'+(arrived?' zap-arrived':'');overlay.setAttribute('role','status');overlay.setAttribute('aria-live','polite');overlay.tabIndex=-1;
      for(const side of ['left','right']){const panel=document.createElement('span');panel.className='zap-panel zap-panel-'+side;panel.setAttribute('aria-hidden','true');overlay.append(panel);}
      const seam=document.createElement('span');seam.className='zap-seam';seam.setAttribute('aria-hidden','true');overlay.append(seam);
      const bolt=document.createElement('span');bolt.className='zap-bolt';bolt.setAttribute('aria-hidden','true');const symbol=document.createElement('span');symbol.className='zap-symbol';bolt.append(symbol);overlay.append(bolt);
      const card=document.createElement('div');card.className='zap-loading-copy';
      const title=document.createElement('h2');title.textContent='Preparando seu próximo passo';
      const text=document.createElement('p');text.dataset.loadingMessage='';
      const hint=document.createElement('small');hint.textContent='Sua página será revelada assim que estiver pronta.';
      card.append(title,text,hint);overlay.append(card);document.body.append(overlay);overlay.focus();
    }
    overlay.classList.remove('is-opening');document.body.setAttribute('aria-busy','true');
    overlay.querySelector('[data-loading-message]').textContent=message;
  }
  function loaded({immediate=false}={}){
    if(!overlay)return;cancelReveal();const target=overlay;
    const remove=()=>{
      if(overlay!==target)return;
      const restore=document.activeElement===target;
      target.remove();overlay=null;document.body.removeAttribute('aria-busy');
      if(restore&&previousFocus?.isConnected)previousFocus.focus({preventScroll:true});previousFocus=null;
    };
    if(immediate){remove();return;}
    revealTimer=setTimeout(()=>{
      if(overlay!==target)return;target.classList.add('is-opening');
      removeTimer=setTimeout(remove,reduced()?motion.reduced:motion.reveal);
    },reduced()?0:Math.max(0,motion.strike-(Date.now()-startedAt)));
  }
  function arrive(){
    try{const time=Number(sessionStorage.getItem('stockzap:loading-handoff'));
      if(time>0&&Date.now()-time>=0&&Date.now()-time<30000){loading('Sua página está pronta.');loaded();}
    }catch{}
  }
  // Do not replay or retain a loading curtain when restoring the previous page.
  root.addEventListener?.('pageshow',event=>{if(event.persisted)loaded({immediate:true});});
  root.StockZapSite=Object.freeze({base:base.href,url,loading,loaded,handoff,arrive});
})(window);
