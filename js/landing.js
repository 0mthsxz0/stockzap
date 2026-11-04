(function(){
  'use strict';
  const U=window.SZUI,C=window.SZCore,seed=window.SZDemo.seed(),initial=C.summary(seed);
  document.querySelectorAll('[data-icon]').forEach(node=>{node.innerHTML=U.icon(node.dataset.icon);});
  const money=C.money,stage=document.getElementById('demo-stage'),restart=document.getElementById('restart-demo'),fullscreen=document.getElementById('fullscreen-demo'),feedback=document.getElementById('demo-feedback'),demoWindow=document.querySelector('.demo-window');
  let frame=null,ready=false,readiness=null,resolveReady,rejectReady,loadTimer,actionTimer,busy=false;
  function chart(summary){
    const daily=summary.daily,max=Math.max(...daily.map(x=>x.sales),1),points=daily.map((v,n)=>`${(n/Math.max(1,daily.length-1)*400).toFixed(1)},${(96-v.sales/max*80).toFixed(1)}`).join(' ');
    const target=document.getElementById('hero-chart');if(!target)return;target.innerHTML=`<svg viewBox="0 0 400 106" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="sales-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#13a76f" stop-opacity=".28"/><stop offset="100%" stop-color="#13a76f" stop-opacity=".02"/></linearGradient></defs><polygon points="0,106 ${points} 400,106" fill="url(#sales-fill)"/><polyline points="${points}" fill="none" stroke="#139b6a" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
  }
  function setText(selector,value){document.querySelectorAll(selector).forEach(node=>{node.textContent=value;});}
  function updateSummary(summary,product){
    setText('[data-metric=sales]',money(summary.sales));setText('[data-metric=products]',summary.productCount);setText('[data-metric=low]',summary.low);
    setText('[data-value-balance]',money(summary.balance));setText('[data-value-payables]',money(summary.payables));
    if(product){setText('[data-value-stock]',product.stock);if(!busy)document.getElementById('result-stock').textContent=product.stock+' unidades';}
  }
  updateSummary({...initial,low:initial.low.length},seed.products.find(p=>p.sku==='CAF-001'));chart(initial);
  const toggle=document.querySelector('.menu-toggle'),nav=document.getElementById('navegacao');
  const header=document.querySelector('.site-header');
  function measureHeader(){document.documentElement.style.setProperty('--header-offset',(header.getBoundingClientRect().height+16)+'px');}
  if('ResizeObserver' in window)new ResizeObserver(measureHeader).observe(header);
  window.addEventListener('resize',measureHeader);measureHeader();
  function closeMenu(){nav.classList.remove('open');toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menu');}
  toggle.addEventListener('click',()=>{const open=nav.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Fechar menu':'Abrir menu');});
  nav.addEventListener('click',event=>{if(event.target.closest('a'))closeMenu();});
  document.addEventListener('click',event=>{if(!event.target.closest('.header-inner'))closeMenu();});
  const tabs=[...document.querySelectorAll('[data-value]')];
  function selectValue(button){
    tabs.forEach(tab=>{const selected=tab===button;tab.setAttribute('aria-selected',String(selected));tab.tabIndex=selected?0:-1;document.getElementById(tab.getAttribute('aria-controls')).hidden=!selected;});
  }
  tabs.forEach((tab,index)=>{
    tab.addEventListener('click',()=>selectValue(tab));
    tab.addEventListener('keydown',event=>{const key=event.key;if(!['ArrowDown','ArrowUp','Home','End'].includes(key))return;event.preventDefault();const next=key==='Home'?0:key==='End'?tabs.length-1:(index+(key==='ArrowDown'?1:tabs.length-1))%tabs.length;selectValue(tabs[next]);tabs[next].focus();});
  });
  function showDemo(){document.getElementById('demo').scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});}
  function finishAction(){busy=false;clearTimeout(actionTimer);document.querySelectorAll('[data-demo-sale]').forEach(button=>{button.disabled=false;});}
  function errorMessage(message){finishAction();feedback.textContent=message;feedback.classList.add('error');}
  function failLoad(){
    clearTimeout(loadTimer);stage.setAttribute('aria-busy','false');restart.disabled=false;ready=false;const error=new Error('A demonstração não carregou. Tente novamente.');rejectReady?.(error);resolveReady=null;rejectReady=null;frame=null;
    stage.innerHTML='<div class="demo-cover demo-load-error" role="alert"><span class="eyebrow">Vamos tentar de novo</span><h3>Não foi possível abrir a demonstração.</h3><p>Confira sua conexão e tente carregar o espaço novamente.</p><button class="button primary" type="button" data-demo-retry>Tentar novamente ↻</button></div>';
    errorMessage(error.message);
  }
  function launch(){
    if(!/^https?:$/.test(location.protocol)){
      const message='A demonstração integrada precisa de HTTP ou HTTPS. Abra pelo Live Server ou execute npm run dev.';
      stage.innerHTML='<div class="demo-cover" role="alert"><h3>Abra a StockZap pelo servidor.</h3><p>Use o Live Server do VSCode ou execute <strong>npm run dev</strong> na pasta do projeto e abra o endereço exibido.</p></div>';return Promise.reject(new Error(message));
    }
    clearTimeout(loadTimer);finishAction();ready=false;
    readiness=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});
    const iframe=document.createElement('iframe');iframe.src=window.StockZapSite.url('demo.html');iframe.title='Demonstração interativa StockZap com dados fictícios';
    // Opaque origin isolates the demo from account cookies and browser storage.
    iframe.setAttribute('sandbox','allow-scripts allow-forms allow-downloads');iframe.setAttribute('referrerpolicy','no-referrer');
    const loading=document.createElement('div');loading.className='demo-loading';loading.setAttribute('role','status');loading.innerHTML='<span class="loading-ring" aria-hidden="true"></span><strong>Preparando seu espaço para testar…</strong><span>Produtos, vendas e financeiro conectados.</span>';
    stage.replaceChildren(iframe,loading);stage.setAttribute('aria-busy','true');frame=iframe;restart.hidden=false;restart.disabled=true;fullscreen.hidden=false;
    feedback.textContent='Preparando a empresa fictícia. Nenhum dado da sua conta é utilizado.';feedback.classList.remove('error');
    document.getElementById('result-order').textContent='Pronto para testar';document.getElementById('result-revenue').textContent='Aguardando sua venda';document.getElementById('result-stock').textContent='6 unidades';document.querySelector('.demo-results').classList.remove('has-result');
    iframe.addEventListener('error',failLoad,{once:true});loadTimer=setTimeout(failLoad,15000);return readiness;
  }
  function ensureDemo(){return frame?(ready?Promise.resolve():readiness):launch();}
  async function command(command,extra={}){
    if(busy)return;const loading=ensureDemo();showDemo();
    try{
      await loading;
      if(command==='sale'){
        if(busy)return;
        busy=true;document.querySelectorAll('[data-demo-sale]').forEach(button=>{button.disabled=true;});feedback.classList.remove('error');feedback.textContent='Registrando a venda e atualizando os registros…';
        actionTimer=setTimeout(()=>errorMessage('A ação demorou para responder. Confira a demonstração antes de tentar novamente.'),8000);
      }
      frame.contentWindow.postMessage({type:'stockzap:demo-command',command,...extra},'*');

    }catch(error){errorMessage(error.message);}
  }
  document.addEventListener('click',event=>{
    const sale=event.target.closest('[data-demo-sale]'),ask=event.target.closest('[data-demo-ask]'),route=event.target.closest('[data-demo-route]'),start=event.target.closest('#start-demo,[data-demo-retry]');
    if(!sale&&!ask&&!route&&!start)return;event.preventDefault();
    if(sale)command('sale');else if(ask)command('ask');else if(route)command('navigate',{route:route.dataset.demoRoute});else{ensureDemo().catch(error=>errorMessage(error.message));showDemo();}
  });
  document.addEventListener('click',event=>{
    const link=event.target.closest('a[href^="#"]');if(!link||event.defaultPrevented)return;
    const target=document.getElementById(link.hash.slice(1));if(!target)return;
    event.preventDefault();closeMenu();measureHeader();history.pushState(null,'',link.hash);
    target.scrollIntoView({block:'start',behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    if(link.classList.contains('skip-link')){target.tabIndex=-1;target.focus({preventScroll:true});}
  });
  restart.addEventListener('click',()=>{launch().catch(error=>errorMessage(error.message));});
  function exitExpanded(){demoWindow.classList.remove('expanded');document.body.classList.remove('demo-expanded');fullscreen.setAttribute('aria-pressed','false');fullscreen.textContent='Ampliar ⛶';fullscreen.focus({preventScroll:true});}
  fullscreen.addEventListener('click',()=>{const open=demoWindow.classList.toggle('expanded');document.body.classList.toggle('demo-expanded',open);fullscreen.setAttribute('aria-pressed',String(open));fullscreen.textContent=open?'Voltar à página ×':'Ampliar ⛶';});
  document.addEventListener('keydown',event=>{if(event.key==='Escape'){if(nav.classList.contains('open')){closeMenu();toggle.focus();}if(demoWindow.classList.contains('expanded'))exitExpanded();}});
  window.addEventListener('message',event=>{
    if(event.source!==frame?.contentWindow||event.origin!=='null'||!event.data||typeof event.data!=='object')return;
    const data=event.data;
    if(data.type==='stockzap:demo-ready'||data.type==='stockzap:demo-effect'){
      if(!data.summary||!Number.isFinite(data.summary.sales))return;
      if(!ready){ready=true;restart.disabled=false;clearTimeout(loadTimer);stage.querySelector('.demo-loading')?.remove();stage.setAttribute('aria-busy','false');resolveReady?.();resolveReady=null;rejectReady=null;feedback.textContent='Tudo pronto. Explore os módulos ou teste a venda guiada.';}
      updateSummary(data.summary,data.product);if(Array.isArray(data.summary.daily))chart(data.summary);
      document.querySelectorAll('.demo-navigation [data-demo-route]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.demoRoute===data.route)));
      if(data.type==='stockzap:demo-effect'&&data.effect){
        const effect=data.effect;finishAction();document.getElementById('result-order').textContent='Venda #'+effect.order+' registrada';document.getElementById('result-stock').textContent=effect.before+' → '+effect.after+' unidades';document.getElementById('result-revenue').textContent='+'+money(effect.amount)+' no financeiro';document.querySelector('.demo-results').classList.add('has-result');feedback.classList.remove('error');feedback.textContent='Pronto! '+effect.product+': uma venda registrada, uma unidade a menos no estoque e '+money(effect.amount)+' de receita paga. Confira os módulos abaixo.';
      }
    }else if(data.type==='stockzap:demo-error')errorMessage(typeof data.message==='string'?data.message:'Não foi possível realizar a ação.');
    else if(data.type==='stockzap:demo-focus'){/* Keep the page at the user's chosen section. */}
    else if(data.type==='stockzap:demo-escape'&&demoWindow.classList.contains('expanded'))exitExpanded();
    else if(data.type==='stockzap:demo-exit'){
      clearTimeout(loadTimer);finishAction();frame=null;ready=false;restart.hidden=true;fullscreen.hidden=true;if(demoWindow.classList.contains('expanded'))exitExpanded();
      stage.innerHTML='<div class="demo-cover"><h3>Seu negócio pode ser o próximo.</h3><p>Crie seu espaço ou continue explorando a empresa fictícia.</p><a class="button primary" href="'+window.StockZapSite.url('cadastro.html')+'">Criar minha conta ↗</a><button class="text-link" type="button" data-demo-retry>Continuar explorando ↗</button></div>';feedback.textContent='Demonstração encerrada. Suas alterações fictícias foram descartadas.';
    }
  });
  if('IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{if(entries.some(entry=>entry.isIntersecting)){observer.disconnect();ensureDemo().catch(()=>{});}},{rootMargin:'150px'});observer.observe(stage);
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches){
      document.documentElement.dataset.motion='on';const reveal=new IntersectionObserver(entries=>{entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');reveal.unobserve(entry.target);}});},{threshold:.08});
      document.querySelectorAll('.value-heading,.value-layout,.section-heading,.care-section,.steps article,.privacy-section,.faq-section,.final-cta').forEach(node=>{node.classList.add('reveal');reveal.observe(node);});
    }
  }
  let scheduled=false;const progress=document.querySelector('.reading-progress');
  function onScroll(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;const distance=document.documentElement.scrollHeight-innerHeight;progress.style.transform='scaleX('+(distance>0?Math.min(1,scrollY/distance):0)+')';document.querySelector('.site-header').classList.toggle('scrolled',scrollY>20);});}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
})();

