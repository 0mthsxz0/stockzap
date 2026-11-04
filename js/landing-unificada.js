'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const frame=document.getElementById('aplicativo-experimento'),start=document.getElementById('iniciar-experimento'),expand=document.getElementById('ampliar-experimento'),close=document.getElementById('fechar-experimento'),cover=document.getElementById('capa-experimento'),status=document.getElementById('estado-experimento');
 const header=document.querySelector('.site-header');
 let loaded=false;
 const syncHeader=()=>document.body.style.setProperty('--header-height',Math.ceil(header.getBoundingClientRect().height)+'px');
 syncHeader();
 if(typeof ResizeObserver!=='undefined')new ResizeObserver(syncHeader).observe(header);
 window.addEventListener('resize',syncHeader);
 function open(route){
  if(!loaded){frame.src=frame.dataset.src;loaded=true;}
  if(route==='zapcare')frame.src=frame.dataset.src.replace('#dashboard','#zapcare');
  frame.hidden=false;cover.hidden=true;start.hidden=true;expand.hidden=false;close.hidden=false;
  status.textContent='Experimentação com dados fictícios. Use o menu do aplicativo para explorar.';
 }
 function navigate(hash,route,update=true){
  const target=document.getElementById(hash.slice(1));if(!target)return;
  if(hash==='#experimentar')open(route);
  if(update&&window.location.hash!==hash)window.history.pushState(null,'',hash);
  requestAnimationFrame(()=>{syncHeader();target.scrollIntoView({block:'start',behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});});
 }
 start.addEventListener('click',()=>open());
 close.addEventListener('click',()=>{frame.hidden=true;cover.hidden=false;start.hidden=false;expand.hidden=true;close.hidden=true;start.textContent='Continuar experimentando';status.textContent='Experimentação recolhida. Suas alterações no exemplo continuam neste navegador.';start.focus();});
 expand.addEventListener('click',async()=>{
  try {if(frame.requestFullscreen)await frame.requestFullscreen();else status.textContent='Use o zoom do navegador para ampliar a experimentação.';}
  catch(_){status.textContent='Não foi possível ampliar. Você pode continuar usando o aplicativo abaixo.';}
 });
 document.querySelectorAll('a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
  const hash=link.getAttribute('href');if(!hash||hash==='#'||!document.getElementById(hash.slice(1)))return;
  if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;
  event.preventDefault();navigate(hash,link.dataset.demoRoute);
 }));
 window.addEventListener('hashchange',()=>navigate(window.location.hash,undefined,false));
 if(window.location.hash)navigate(window.location.hash,undefined,false);
});
