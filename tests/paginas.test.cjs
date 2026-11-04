const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const C=require('../js/core.js');const D=require('../js/dashboard-core.js');
class Node {
 constructor(){this.value='';this.children=[];this.dataset={};this.events={};this.attrs={};this.textContent='';this.innerHTML='';this.classList={add(){},remove(){},toggle(){}};}
 addEventListener(name,fn){this.events[name]=fn;}
 append(...nodes){this.children.push(...nodes);} appendChild(n){this.append(n);}
 replaceChildren(...nodes){this.children=nodes;} setAttribute(k,v){this.attrs[k]=v;}
 reset(){} focus(){}
}
async function page(file,user={id:'ana'}) {
 const nodes=new Map(),data=new Map(),events={};
 const node=id=>{if(!nodes.has(id))nodes.set(id,new Node());return nodes.get(id);};
 const storage={getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v)};
 const app={ready:Promise.resolve(user),active:()=>{if(!user)throw Error('Sem sessão');return user;},message:(text)=>{node('aviso-app').textContent=text;},
  element:(tag,text)=>{const n=new Node();n.textContent=text;return n;},
  storageKey:name=>`stockzap:usuario:${user.id}:${name}:v1`,readPreference:(name,fallback)=>storage.getItem(app.storageKey(name))??fallback,writePreference:(name,value)=>storage.setItem(app.storageKey(name),value)};
 const context={document:{getElementById:node,querySelector:node,querySelectorAll:()=>[],createElement:()=>new Node(),createElementNS:()=>new Node()},StockZap:app,StockZapCore:C,StockZapDashboard:D,localStorage:storage,crypto:require('node:crypto').webcrypto,window:{addEventListener:(name,fn)=>events[name]=fn},confirm:()=>true};
 vm.runInNewContext(fs.readFileSync(file,'utf8'),context);await app.ready;await Promise.resolve();
 return {node,storage,events,context};
}
test('Produtos: salva e edita pela tela, rejeitando duplicata sem perder catálogo',async()=>{
 const p=await page('js/funcionalidades_internas/produtos.js');
 for(const [id,value] of Object.entries({nome:'Café',codigo:'CAF',categoria:'Bebidas',preco:'10',estoque:'3','estoque-minimo':'2'}))p.node(id).value=value;
 p.node('form-produto').events.submit({preventDefault(){}});
 let items=C.loadProducts(p.storage,'ana').items;assert.equal(items.length,1);assert.equal(items[0].nome,'Café');
 p.node('produto-id').value='';p.node('codigo').value=' caf ';
 p.node('form-produto').events.submit({preventDefault(){}});
 assert.equal(C.loadProducts(p.storage,'ana').items.length,1);assert.match(p.node('aviso-app').textContent,/código/);
 p.node('produto-id').value=items[0].id;p.node('nome').value='Café especial';p.node('codigo').value='CAF';
 p.node('form-produto').events.submit({preventDefault(){}});assert.equal(C.loadProducts(p.storage,'ana').items[0].nome,'Café especial');
 p.context.excluirProduto(items[0].id);assert.equal(C.loadProducts(p.storage,'ana').items.length,0);
});
test('Dashboard: reflete gravação de outra aba e usa perfil da mesma conta',async()=>{
 const p=await page('js/funcionalidades_internas/dashboard.js');
 assert.equal(p.node('dashboard-total-produtos').textContent,0);
 C.saveProducts(p.storage,'ana',[{id:1,nome:'Café',codigo:'C',categoria:'Bebidas',preco:10,estoque:3,estoqueMinimo:4}],null);
 p.storage.setItem('stockzap:usuario:ana:perfil-zapchat:v1',JSON.stringify({perfil:{operacao:'Fixo',segmento:'Mercado',oferta:'Produtos',maturidade:'Planilha',prioridade:'Estoque'}}));
 p.events.storage({key:C.productKey('ana')});
 assert.equal(p.node('dashboard-total-produtos').textContent,1);assert.equal(p.node('dashboard-itens-estoque').textContent,3);
 assert.equal(p.node('dashboard-estoque-baixo').textContent,1);assert.equal(p.node('foco-negocio').textContent,'Sua prioridade: Estoque');
 assert.equal(p.node('acao-prioridade').href,'produtos.html');
});
test('Dashboard não carrega catálogo sem sessão e informa erro de JSON corrompido',async()=>{
 const anonymous=await page('js/funcionalidades_internas/dashboard.js',null);assert.equal(anonymous.node('dashboard-total-produtos').textContent,'');
 const p=await page('js/funcionalidades_internas/dashboard.js');p.storage.setItem(C.productKey('ana'),'{');p.events.storage({key:C.productKey('ana')});
 assert.equal(p.node('dashboard-total-produtos').textContent,'Indisponível');assert.match(p.node('aviso-app').textContent,/preservados/);
});
