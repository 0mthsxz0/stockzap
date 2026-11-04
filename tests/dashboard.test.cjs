const {test}=require('node:test');const assert=require('node:assert/strict');
const D=require('../js/dashboard-core.js');
test('catálogo vazio não inventa indicadores de venda',()=>{const s=D.summarize([]);assert.equal(s.total,0);assert.equal(s.units,0);assert.equal(s.value,0);assert.deepEqual(s.low,[]);assert.equal(s.sales,undefined);});
test('resumo reflete alterações e agrupa quantidades por categoria',()=>{
 const items=[{nome:'A',categoria:'Bebidas',estoque:3,estoqueMinimo:3,preco:2},{nome:'B',categoria:'Bebidas',estoque:0,estoqueMinimo:2,preco:4}];
 const s=D.summarize(items);assert.equal(s.units,3);assert.equal(s.value,6);assert.equal(s.low.length,2);assert.deepEqual(s.categories,[['Bebidas',3]]);
 items[0].estoque=5;assert.equal(D.summarize(items).low.length,1);
});
test('perfil ausente é opcional e perfil malformado é rejeitado',()=>{assert.equal(D.profile(null),null);assert.throws(()=>D.profile('{}'));assert.throws(()=>D.profile('{'));});
test('perfil válido expõe apenas campos conhecidos',()=>{const p={operacao:'Fixo',segmento:'Mercado',oferta:'Produtos',maturidade:'Planilha',prioridade:'Estoque',extra:'ignorar'};assert.equal(D.profile(JSON.stringify({perfil:p})).prioridade,'Estoque');assert.equal(D.profile(JSON.stringify({perfil:p})).extra,undefined);});
