/* Uma sugestão de compra não movimenta o estoque. */
(function(root){
 'use strict';
 function plan(products,targets={}) {
  return products.filter(p=>p.estoque<=p.estoqueMinimo).map(p=>{
   const target=Object.prototype.hasOwnProperty.call(targets,p.id)?targets[p.id]:Math.min(Number.MAX_SAFE_INTEGER,Math.max(1,p.estoqueMinimo*2));
   if(!Number.isSafeInteger(target)||target<0)throw new Error('Informe uma meta inteira e não negativa.');
   return {id:p.id,nome:p.nome,codigo:p.codigo,categoria:p.categoria,atual:p.estoque,minimo:p.estoqueMinimo,meta:target,comprar:Math.max(0,target-p.estoque),urgencia:p.estoque===0?'Esgotado':'Estoque baixo'};
  }).sort((a,b)=>(a.atual===0?0:1)-(b.atual===0?0:1)||a.atual/Math.max(a.minimo,1)-b.atual/Math.max(b.minimo,1)||a.nome.localeCompare(b.nome,'pt-BR'));
 }
 function csv(rows){
  // Impede que nomes/códigos sejam interpretados como fórmulas na planilha.
  const cell=v=>'"'+String(typeof v==='string'&&/^[\s]*[=+@-]/.test(v)?"'"+v:v).replaceAll('"','""')+'"';
  return '\uFEFF'+[['Produto','Código','Categoria','Atual','Mínimo','Meta','Comprar','Situação'],...rows.filter(r=>r.comprar>0).map(r=>[r.nome,r.codigo,r.categoria,r.atual,r.minimo,r.meta,r.comprar,r.urgencia])].map(r=>r.map(cell).join(';')).join('\r\n');
 }
 const api={plan,csv};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StockZapReposicao=api;
})(typeof window!=='undefined'?window:globalThis);
