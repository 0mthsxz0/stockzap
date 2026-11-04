const {test}=require('node:test');
const assert=require('node:assert/strict');
const C=require('../js/core.js');
const produto={id:'p1',nome:'Café',codigo:'CAF',categoria:'Bebidas',preco:10,estoque:5,estoqueMinimo:2};
function storage(){const m=new Map();return {getItem:k=>m.get(k)??null,setItem:(k,v)=>m.set(k,v)};}
test('contas distintas não leem produtos umas das outras nem legado compartilhado',()=>{
 const s=storage();s.setItem('stockzap_produtos',JSON.stringify([produto]));
 assert.deepEqual(C.loadProducts(s,'ana').items,[]);
 C.saveProducts(s,'ana',[produto],null);
 assert.deepEqual(C.loadProducts(s,'bia').items,[]);
 assert.equal(C.loadProducts(s,'ana').items.length,1);
});
test('edição não aceita código duplicado com caixa/espaço diferentes',()=>{
 const items=[produto,{...produto,id:'p2',codigo:'OUTRO'}];
 assert.throws(()=>C.upsertProduct(items,{...produto,codigo:' caf '},'p2'),/código/);
});
test('quantidades fracionárias, NaN e negativos são recusados',()=>{
 for(const estoque of [-1,1.5,NaN,Infinity]) assert.ok(C.validateProduct({...produto,estoque}));
});
test('aba desatualizada não sobrescreve outra gravação',()=>{
 const s=storage();C.saveProducts(s,'ana',[produto],null);
 assert.throws(()=>C.saveProducts(s,'ana',[],null),/outra aba/);
 assert.equal(C.loadProducts(s,'ana').items.length,1);
});
test('JSON corrompido é preservado, sem substituição silenciosa',()=>{
 const s=storage();s.setItem(C.productKey('ana'),'{inválido');
 assert.throws(()=>C.loadProducts(s,'ana'),/preservados/);
 assert.equal(s.getItem(C.productKey('ana')),'{inválido');
});
