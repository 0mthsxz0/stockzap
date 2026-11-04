/* Planning never changes product stock. Targets are temporary until the page reloads. */
(function(root){
 'use strict';
 function plan(products,targets={}){
  return products.filter(p=>!p.archived&&p.stock<=p.minStock).map(p=>{
   const target=Object.hasOwn(targets,p.id)?targets[p.id]:Math.max(1,p.targetStock||p.minStock*2);
   if(!Number.isSafeInteger(target)||target<0)throw new Error('Informe uma meta inteira e não negativa.');
   const quantity=Math.max(0,target-p.stock);
   return {id:p.id,name:p.name,sku:p.sku,category:p.category,stock:p.stock,minStock:p.minStock,target,quantity,cost:Math.round(quantity*p.cost*100)/100,status:p.stock===0?'Esgotado':'Estoque baixo'};
  }).sort((a,b)=>(a.stock===0?0:1)-(b.stock===0?0:1)||a.stock/Math.max(a.minStock,1)-b.stock/Math.max(b.minStock,1)||a.name.localeCompare(b.name,'pt-BR'));
 }
 function csv(rows){
  const cell=value=>'"'+String(typeof value==='string'&&/^\s*[=+@-]/.test(value)?"'"+value:value).replaceAll('"','""')+'"';
  return '\ufeff'+[['Produto','Código','Categoria','Atual','Mínimo','Meta','Comprar','Custo estimado','Situação'],...rows.filter(r=>r.quantity>0).map(r=>[r.name,r.sku,r.category,r.stock,r.minStock,r.target,r.quantity,r.cost.toFixed(2).replace('.',','),r.status])].map(row=>row.map(cell).join(';')).join('\r\n');
 }
 const api={plan,csv};if(typeof module!=='undefined')module.exports=api;else root.SZReplenishment=api;
})(typeof window!=='undefined'?window:globalThis);
