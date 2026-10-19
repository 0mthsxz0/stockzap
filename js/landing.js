(function(){
  'use strict';
  const U=window.SZUI,C=window.SZCore,state=window.SZDemo.seed(),summary=C.summary(state);
  document.querySelectorAll('[data-icon]').forEach(node=>{node.innerHTML=U.icon(node.dataset.icon);});
  document.querySelector('[data-metric=sales]').textContent=C.money(summary.sales);
  document.querySelector('[data-metric=products]').textContent=summary.productCount;
  document.querySelector('[data-metric=low]').textContent=summary.low.length;
  const daily=summary.daily,max=Math.max(...daily.map(x=>x.sales),1),points=daily.map((v,index)=>`${(index/(daily.length-1)*400).toFixed(1)},${(96-v.sales/max*80).toFixed(1)}`).join(' ');
  document.getElementById('hero-chart').innerHTML=`<svg viewBox="0 0 400 106" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#a6d291" stop-opacity=".5"/><stop offset="100%" stop-color="#a6d291" stop-opacity=".03"/></linearGradient></defs><polygon points="0,106 ${points} 400,106" fill="url(#sales-fill)"/><polyline points="${points}" fill="none" stroke="#428749" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
  const toggle=document.querySelector('.menu-toggle'),nav=document.getElementById('navegacao');
  function closeMenu(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu');}
  toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});
  nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&nav.classList.contains('open')){closeMenu();toggle.focus();}});
  const stage=document.getElementById('demo-stage'),restart=document.getElementById('restart-demo');let frame;
  function launch(){
    const iframe=document.createElement('iframe');iframe.src='/app.html?demo=1';iframe.title='Demonstração interativa StockZap com dados fictícios';
    // The demo has an opaque origin: it cannot access the parent, cookies or account storage.
    iframe.setAttribute('sandbox','allow-scripts allow-forms allow-downloads');iframe.setAttribute('referrerpolicy','no-referrer');
    stage.replaceChildren(iframe);frame=iframe;restart.hidden=false;iframe.focus({preventScroll:true});stage.scrollIntoView({block:'start',behavior:'auto'});
  }
  document.getElementById('start-demo').addEventListener('click',launch);
  restart.addEventListener('click',()=>{if(confirm('Reiniciar a demonstração e descartar as alterações fictícias?'))launch();});
  window.addEventListener('message',event=>{
    if(event.source!==frame?.contentWindow||event.origin!=='null'||event.data?.type!=='stockzap:demo-exit')return;
    stage.innerHTML='<div class="demo-cover"><h3>Continue explorando quando quiser.</h3><p>Ou crie uma conta para começar seu próprio espaço.</p><button class="button primary" type="button" id="open-again">Abrir demonstração novamente ↗</button><a class="text-link" href="/cadastro.html">Criar minha conta ↗</a></div>';
    document.getElementById('open-again').addEventListener('click',launch);restart.hidden=true;frame=null;
  });
})();
