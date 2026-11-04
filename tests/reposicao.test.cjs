const {test}=require('node:test');const assert=require('node:assert/strict');const R=require('../js/reposicao-core.js');
const item={id:'p',nome:'Café',codigo:'CAF',categoria:'Bebidas',estoque:3,estoqueMinimo:5};
test('sugere diferença até duas vezes o mínimo sem modificar catálogo',()=>{const before=JSON.stringify(item);assert.equal(R.plan([item])[0].comprar,7);assert.equal(JSON.stringify(item),before);});
test('esgotados vêm primeiro e estoque saudável fica fora da lista',()=>{const rows=R.plan([item,{...item,id:'z',estoque:0},{...item,id:'ok',estoque:6}]);assert.equal(rows.length,2);assert.equal(rows[0].id,'z');});
test('meta editável pode reduzir ou zerar uma compra; frações são recusadas',()=>{assert.equal(R.plan([item],{p:4})[0].comprar,1);assert.equal(R.plan([item],{p:0})[0].comprar,0);for(const v of [-1,1.5,NaN])assert.throws(()=>R.plan([item],{p:v}));});
test('mínimo zero com produto esgotado sugere pelo menos uma unidade',()=>assert.equal(R.plan([{...item,estoque:0,estoqueMinimo:0}])[0].comprar,1));
test('CSV inclui BOM, separador Excel, aspas e proteção contra fórmulas',()=>{const csv=R.csv(R.plan([{...item,nome:'=HYPERLINK("x")',codigo:'@SUM(1)'}]));assert.ok(csv.startsWith('\uFEFF'));assert.ok(csv.includes('"\'=HYPERLINK(""x"")"'));assert.ok(csv.includes('"\'@SUM(1)"'));assert.ok(csv.includes('\r\n'));});
test('CSV não inclui produtos cuja compra foi zerada',()=>assert.equal(R.csv(R.plan([item],{p:0})).split('\r\n').length,1));
test('exemplo da página permite ajustar meta e habilita a exportação sem login',async()=>{
 const fs=require('node:fs'),vm=require('node:vm');const nodes=new Map();
 class N{constructor(){this.children=[];this.events={};this.value='';}append(n){this.children.push(n);}replaceChildren(){this.children=[];}setAttribute(){}addEventListener(k,fn){this.events[k]=fn;}}
 const node=id=>{if(!nodes.has(id))nodes.set(id,new N());return nodes.get(id);};
 const context={document:{getElementById:node,createElement:()=>new N()},location:{search:'?demo=1'},URLSearchParams,StockZapReposicao:R,StockZapCore:require('../js/core.js')};
 vm.runInNewContext(fs.readFileSync('js/reposicao.js','utf8'),context);await Promise.resolve();
 assert.equal(node('esgotados').textContent,1);assert.equal(node('unidades').textContent,28);assert.equal(node('baixar').disabled,false);
 const input=node('lista').children[0].children[2].children[0];input.value='6';input.events.change();assert.equal(node('unidades').textContent,24);
});
