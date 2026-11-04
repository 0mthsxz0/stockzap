'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {seed}=require('../js/erp/demo.js'),C=require('../js/erp/core.js'),Care=require('../js/erp/zapcare.js');
const sale=(s,extra={})=>C.mutate(s,'order.create',{customerId:s.customers[0].id,items:[{productId:s.products[0].id,quantity:2}],paymentStatus:'Pago',paymentMethod:'Pix',channel:'Balcão',dueDate:s.asOf,...extra});
test('pedido movimenta estoque e receita mantendo preços históricos',()=>{
 const s=seed(),next=sale(s),o=next.orders[0],p=s.products[0];
 assert.equal(next.products[0].stock,p.stock-2);assert.equal(s.products[0].stock,p.stock);
 assert.equal(next.transactions.find(t=>t.orderId===o.id).amount,o.total);
 const edited=C.mutate(next,'product.save',{...next.products[0],price:100});assert.equal(edited.orders[0].items[0].price,p.price);
});
test('estoque insuficiente e quantidades fracionadas não criam pedidos',()=>{
 const s=seed();for(const quantity of [1.2,-1,1e9,NaN])assert.throws(()=>sale(s,{items:[{productId:s.products[0].id,quantity}]}));
 assert.equal(s.revision,1);
});
test('cancelamento de pedido pago devolve estoque uma vez e registra reembolso',()=>{
 const s=seed(),sold=sale(s),id=sold.orders[0].id,next=C.mutate(sold,'order.status',{id,status:'Cancelado'});
 assert.equal(next.products[0].stock,s.products[0].stock);assert.throws(()=>C.mutate(next,'order.status',{id,status:'Cancelado'}));
 assert.equal(next.orders[0].paymentStatus,'Reembolso pendente');
 const refund=next.transactions.find(t=>t.refundOrderId===id);assert.equal(refund.status,'Pendente');
 const paid=C.mutate(next,'transaction.pay',{id:refund.id});assert.equal(C.summary(paid).balance,C.summary(s).balance);
});
test('pagamento de conta antiga entra no caixa na data de baixa',()=>{
 const s=seed(),tx=s.transactions.find(t=>t.status==='Pendente'&&t.date<s.asOf),next=C.mutate(s,'transaction.pay',{id:tx.id});
 assert.equal(next.transactions.find(t=>t.id===tx.id).paidDate,s.asOf);
});
test('SKU duplicado, data inválida e valores inválidos são rejeitados',()=>{
 const s=seed();assert.throws(()=>C.mutate(s,'product.save',{...s.products[1],sku:s.products[0].sku}));
 assert.throws(()=>C.mutate(s,'task.save',{...s.tasks[0],date:'2026-02-31'}));
 assert.throws(()=>C.mutate(s,'transaction.create',{type:'Despesa',description:'Teste',category:'Teste',amount:Infinity,date:s.asOf,dueDate:s.asOf,status:'Pago'}));
});
test('ZapChat consulta registros atualizados após uma movimentação',()=>{
 const s=seed(),p=s.products[0],next=C.mutate(s,'stock.move',{productId:p.id,type:'Entrada',quantity:10,reason:'Teste'});
 const answer=Care.answer(next,'Qual o estoque do '+p.sku+'?');assert.match(answer.text,new RegExp(String(p.stock+10)));assert.equal(answer.revision,next.revision);
});

