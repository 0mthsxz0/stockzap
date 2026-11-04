'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),R=require('../js/erp/replenishment.js'),C=require('../js/erp/core.js'),{seed}=require('../js/erp/demo.js');
const p={id:'p',name:'Café',sku:'CAF',category:'Bebidas',stock:3,minStock:5,targetStock:10,cost:7};
test('lista prioriza esgotados, ignora arquivados e não modifica o estoque',()=>{
 const ps=[p,{...p,id:'zero',stock:0},{...p,id:'ok',stock:6},{...p,id:'old',archived:true}],before=JSON.stringify(ps),rows=R.plan(ps);
 assert.equal(rows.length,2);assert.equal(rows[0].id,'zero');assert.equal(rows[1].quantity,7);assert.equal(rows[1].cost,49);assert.equal(JSON.stringify(ps),before);
});
test('meta ajustável reduz ou zera compra e recusa valores inválidos',()=>{
 assert.equal(R.plan([p],{p:4})[0].quantity,1);assert.equal(R.plan([p],{p:0})[0].quantity,0);
 for(const value of [-1,1.5,NaN,Infinity])assert.throws(()=>R.plan([p],{p:value}));
 assert.equal(R.plan([{...p,stock:0,minStock:0,targetStock:0}])[0].quantity,1);
});
test('CSV exporta apenas compras e neutraliza fórmulas inclusive com espaço inicial',()=>{
 const csv=R.csv(R.plan([{...p,name:' =SUM(1)',sku:'@CMD'},{...p,id:'omit'}],{omit:0}));
 assert.ok(csv.startsWith('\ufeff'));assert.match(csv,/"' =SUM\(1\)"/);assert.match(csv,/"'@CMD"/);assert.equal(csv.split('\r\n').length,2);
});
test('venda da demonstração atualiza reposição e indicadores com a mesma base',()=>{
 const state=seed(),product=state.products.find(p=>p.sku==='CAF-001'),before=R.plan(state.products).find(r=>r.id===product.id);
 const sold=C.mutate(state,'order.create',{customerId:state.customers[0].id,items:[{productId:product.id,quantity:1}],paymentStatus:'Pago',paymentMethod:'Pix',channel:'Balcão',dueDate:state.asOf});
 assert.equal(R.plan(sold.products).find(r=>r.id===product.id).quantity,before.quantity+1);assert.equal(C.summary(sold).stockUnits,C.summary(state).stockUnits-1);
});
