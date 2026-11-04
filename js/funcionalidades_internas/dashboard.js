"use strict";
StockZap.ready.then(user => {
 if (!user) return;
 const C=StockZapCore, D=StockZapDashboard;
 const money=n=>n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
 const set=(id,text)=>{document.getElementById(id).textContent=text;};
 let tipo=StockZap.readPreference('grafico','linha');
 if (!['linha','barras'].includes(tipo)) tipo='linha';
 const labels=['Operação','Segmento','Modelo','Maturidade','Prioridade'];
 function renderProfile() {
  const area=document.getElementById('perfil-negocio');area.replaceChildren();
  try {
   const p=D.profile(StockZap.readPreference('perfil-zapchat',null));
   if (!p) {area.textContent='Complete o ZapChat nesta conta para personalizar seu painel.';return;}
   Object.values(p).forEach((value,i)=>area.append(StockZap.element('p',labels[i]+': '+value)));
   const focus=document.getElementById('foco-negocio');
   focus.textContent='Sua prioridade: '+p.prioridade;
   const link=document.getElementById('acao-prioridade');
   const available=['Produtos','Estoque'].includes(p.prioridade);
   link.href=available?'produtos.html':'../primeiro_contato/zapchat-perguntas.html';
   link.textContent=available?'Organizar meus produtos':'Revisar meu perfil';
   document.getElementById('card-alertas').classList.toggle('prioridade-estoque',p.prioridade==='Estoque');
  } catch (_) {area.textContent='Não foi possível ler seu perfil. Refaça o ZapChat para atualizar.';}
 }
 function renderChart(categories) {
  const area=document.getElementById('grafico-visual');area.replaceChildren();
  if (!categories.length) {area.textContent='Cadastre produtos para visualizar as quantidades por categoria.';return;}
  const max=Math.max(...categories.map(c=>c[1]),1);
  const list=StockZap.element('ul');
  for (const [name,units] of categories) list.append(StockZap.element('li',name+': '+units+' un.'));
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
  svg.setAttribute('viewBox','0 0 700 250');svg.setAttribute('role','img');svg.setAttribute('aria-label','Itens em estoque por categoria');
  const step=640/Math.max(categories.length,1);
  const points=categories.map((c,i)=>({x:30+step*(i+.5),y:220-c[1]/max*180}));
  if(tipo==='linha') {
   const line=document.createElementNS(ns,'polyline');line.setAttribute('points',points.map(p=>p.x+','+p.y).join(' '));line.setAttribute('fill','none');line.setAttribute('stroke','#067429');line.setAttribute('stroke-width','3');svg.append(line);
  }
  points.forEach((p,i)=>{
   const node=document.createElementNS(ns,tipo==='barras'?'rect':'circle');
   if(tipo==='barras') {node.setAttribute('x',p.x-step*.3);node.setAttribute('y',p.y);node.setAttribute('width',step*.6);node.setAttribute('height',220-p.y);}
   else {node.setAttribute('cx',p.x);node.setAttribute('cy',p.y);node.setAttribute('r','5');}
   node.setAttribute('fill','#067429');svg.append(node);
  });
  area.append(svg,list);
 }
 function render() {
  try {
   const items=C.loadProducts(localStorage,user.id).items;
   const summary=D.summarize(items);
   set('dashboard-total-produtos',summary.total);set('dashboard-itens-estoque',summary.units);
   set('dashboard-valor-catalogo',money(summary.value));set('dashboard-estoque-baixo',summary.low.length);
   const list=document.getElementById('lista-estoque-baixo-dashboard');list.replaceChildren();
   for (const p of summary.low.slice(0,5)) list.append(StockZap.element('p',p.nome+' · '+p.estoque+' un. · mínimo '+p.estoqueMinimo));
   if(!summary.low.length) list.textContent=items.length?'Nenhum produto no mínimo ou abaixo.':'Seu catálogo está vazio. Comece cadastrando um produto.';
   renderChart(summary.categories);renderProfile();
   set('data-dashboard',new Date().toLocaleDateString('pt-BR',{dateStyle:'long'}));
  } catch(erro) {
   for(const id of ['dashboard-total-produtos','dashboard-itens-estoque','dashboard-valor-catalogo','dashboard-estoque-baixo']) set(id,'Indisponível');
   document.getElementById('lista-estoque-baixo-dashboard').replaceChildren();
   document.getElementById('grafico-visual').replaceChildren();
   StockZap.message(erro.message,true);
  }
 }
 document.querySelectorAll('[data-tipo]').forEach(button=>button.addEventListener('click',()=>{
  tipo=button.dataset.tipo;StockZap.writePreference('grafico',tipo);
  document.querySelectorAll('[data-tipo]').forEach(b=>{b.classList.toggle('ativo',b===button);b.setAttribute('aria-pressed',String(b===button));});render();
 }));
 document.querySelectorAll('[data-tipo]').forEach(b=>{b.classList.toggle('ativo',b.dataset.tipo===tipo);b.setAttribute('aria-pressed',String(b.dataset.tipo===tipo));});
 window.addEventListener('storage',event=>{
  if(event.key===null || event.key===C.productKey(user.id) || event.key===StockZap.storageKey('perfil-zapchat')) render();
 });
 render();
});
