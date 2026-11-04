'use strict';
(async()=>{
 const $=id=>document.getElementById(id),R=StockZapReposicao;
 const demo=new URLSearchParams(location.search).get('demo')==='1';
 const targets={};let products=[],rows=[],userId=null;
 function error(message){$('erro').textContent=message;$('erro').hidden=!message;}
 function render(){
  rows=R.plan(products,targets);$('lista').replaceChildren();
  for(const row of rows){
   const tr=document.createElement('tr'),name=document.createElement('td');name.textContent=row.nome;
   const code=document.createElement('small');code.textContent=row.codigo+' · '+row.categoria;name.append(code);tr.append(name);
   const count=document.createElement('td');count.textContent=row.atual+' / '+row.minimo;tr.append(count);
   const field=document.createElement('td'),input=document.createElement('input');input.type='number';input.min='0';input.step='1';input.max=String(Number.MAX_SAFE_INTEGER);input.value=row.meta;input.setAttribute('aria-label','Meta de '+row.nome);
   input.addEventListener('change',()=>{
    const value=Number(input.value);
    if(input.value.trim()===''||!Number.isSafeInteger(value)||value<0){error('Informe uma meta inteira e não negativa para '+row.nome+'.');input.value=row.meta;return;}
    error('');targets[row.id]=value;render();
   });field.append(input);tr.append(field);
   for(const text of [row.comprar+' un.',row.urgencia]){const td=document.createElement('td');td.textContent=text;if(row.atual===0)td.className='urgente';tr.append(td);}
   $('lista').append(tr);
  }
  $('esgotados').textContent=rows.filter(r=>r.atual===0).length;
  $('produtos').textContent=rows.filter(r=>r.comprar>0).length;
  $('unidades').textContent=rows.reduce((n,r)=>n+r.comprar,0);
  $('vazio').hidden=rows.length>0;$('baixar').disabled=!rows.some(r=>r.comprar>0);
 }
 function load(){try{products=StockZapCore.loadProducts(localStorage,userId).items;error('');render();}catch(e){rows=[];$('lista').replaceChildren();$('baixar').disabled=true;for(const id of ['produtos','unidades','esgotados'])$(id).textContent='—';$('vazio').hidden=true;error(e.message);}}
 $('baixar').addEventListener('click',()=>{
  if(!rows.some(r=>r.comprar>0))return;
  const url=URL.createObjectURL(new Blob([R.csv(rows)],{type:'text/csv;charset=utf-8'}));
  const a=document.createElement('a');a.href=url;a.download=demo?'stockzap-reposicao-exemplo.csv':'stockzap-reposicao.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
 });
 if(demo){
  products=[{id:'1',nome:'Café 500g',codigo:'CAF-01',categoria:'Bebidas',preco:18,estoque:0,estoqueMinimo:5},{id:'2',nome:'Arroz 5kg',codigo:'ARR-01',categoria:'Alimentos',preco:25,estoque:3,estoqueMinimo:8},{id:'3',nome:'Feijão 1kg',codigo:'FEI-01',categoria:'Alimentos',preco:9,estoque:5,estoqueMinimo:5}];
  $('estado').textContent='Exemplo interativo com dados fictícios. Ajuste uma meta e baixe a lista; seu catálogo real não será alterado.';render();return;
 }
 try{
  // Só carrega a autenticação no modo da conta; o exemplo funciona sem CDN e sem login.
  for(const src of ['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2','js/supabase.js'])await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src=src;s.onload=resolve;s.onerror=()=>reject(new Error('Não foi possível carregar a autenticação. Confira a conexão.'));document.head.append(s);});
  const {data,error:authError}=await stockzapSupabase.auth.getUser();
  if(authError||!data.user){$('estado').textContent='Entre na sua conta para carregar os produtos, ou abra Ver exemplo.';return;}
  userId=data.user.id;$('estado').textContent='Lista calculada com os produtos da sua conta neste navegador.';
  stockzapSupabase.auth.onAuthStateChange((event,session)=>{if(event==='SIGNED_OUT'||(session?.user&&session.user.id!==userId))location.reload();});
  load();window.addEventListener('storage',event=>{if(event.key===null||event.key===StockZapCore.productKey(userId))load();});
 }catch(e){$('estado').textContent='Não foi possível carregar a conta. Você pode abrir Ver exemplo.';error(e.message);}
})();
