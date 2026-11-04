'use strict';
document.addEventListener('DOMContentLoaded',()=>{
 const frame=document.getElementById('aplicativo-experimento'),start=document.getElementById('iniciar-experimento'),expand=document.getElementById('ampliar-experimento'),close=document.getElementById('fechar-experimento'),cover=document.getElementById('capa-experimento'),status=document.getElementById('estado-experimento');
 let loaded=false;
 function open(route){
  if(!loaded){frame.src=frame.dataset.src;loaded=true;}
  if(route==='zapcare')frame.src=frame.dataset.src.replace('#dashboard','#zapcare');
  frame.hidden=false;cover.hidden=true;start.hidden=true;expand.hidden=false;close.hidden=false;
  status.textContent='Experimentação com dados fictícios. Use o menu do aplicativo para explorar.';
 }
 start.addEventListener('click',()=>open());
 close.addEventListener('click',()=>{frame.hidden=true;cover.hidden=false;start.hidden=false;expand.hidden=true;close.hidden=true;start.textContent='Continuar experimentando';status.textContent='Experimentação recolhida. Suas alterações no exemplo continuam neste navegador.';});
 expand.addEventListener('click',async()=>{
  try {if(frame.requestFullscreen)await frame.requestFullscreen();else status.textContent='Use o zoom do navegador para ampliar a experimentação.';}
  catch(_){status.textContent='Não foi possível ampliar. Você pode continuar usando o aplicativo abaixo.';}
 });
 document.querySelectorAll('a[href="#experimentar"]').forEach(link=>link.addEventListener('click',()=>open(link.dataset.demoRoute)));
 if(window.location.hash==='#experimentar')open();
});
