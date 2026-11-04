const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
function page(hash=''){
 const nodes=new Map();class E{constructor(){this.events={};this.dataset={};this.hidden=false;}addEventListener(k,f){this.events[k]=f;}}
 const get=id=>{if(!nodes.has(id))nodes.set(id,new E());return nodes.get(id);};
 get('aplicativo-experimento').dataset.src='demo/public/app.html?mode=local#dashboard';
 const link=new E();link.dataset.demoRoute='zapcare';let init;
 vm.runInNewContext(fs.readFileSync('js/landing-unificada.js','utf8'),{document:{addEventListener:(_,f)=>init=f,getElementById:get,querySelectorAll:()=>[link]},window:{location:{hash}}});init();
 return {get,link};
}
test('experimento só carrega ao iniciar e mantém o mesmo iframe ao recolher',()=>{
 const p=page(),frame=p.get('aplicativo-experimento');assert.equal(frame.src,undefined);
 p.get('iniciar-experimento').events.click();assert.equal(frame.src,'demo/public/app.html?mode=local#dashboard');assert.equal(frame.hidden,false);
 p.get('fechar-experimento').events.click();assert.equal(frame.hidden,true);
 p.get('iniciar-experimento').events.click();assert.equal(frame.hidden,false);assert.equal(frame.src,'demo/public/app.html?mode=local#dashboard');
});
test('link do ZapCare abre a rota correta na mesma página',()=>{const p=page();p.link.events.click();assert.equal(p.get('aplicativo-experimento').src,'demo/public/app.html?mode=local#zapcare');});
test('link antigo com hash inicia a experimentação automaticamente',()=>assert.equal(page('#experimentar').get('aplicativo-experimento').hidden,false));
test('landing única preserva autenticação real e remove links ao login fictício',()=>{
 const html=fs.readFileSync('stockzap.html','utf8');assert.ok(html.includes('href="html/primeiro_contato/login.html"'));assert.ok(html.includes('href="html/primeiro_contato/cadastro.html"'));assert.ok(!html.includes('href="login.html"'));assert.ok(html.includes('id="experimentar"'));
 const ids=[...html.matchAll(/\bid="([^"]+)"/g)].map(x=>x[1]);assert.equal(new Set(ids).size,ids.length);
 for(const m of html.matchAll(/href="#([^"]+)"/g))assert.ok(ids.includes(m[1]),m[1]);
});
test('endereços antigos redirecionam à landing e Sair retorna fora do iframe',()=>{
 function go(embedded=false,nested=true){let url;const top={location:{replace:u=>url=u}},window={location:{pathname:nested?'/demo/public/index.html':'/',href:nested?'https://example.test/demo/public/index.html':'http://localhost:3000/'},top};if(!embedded){window.top=window;window.location.replace=u=>url=u;}
 vm.runInNewContext(fs.readFileSync('demo/public/js/entrada.js','utf8'),{window,URL});return url;}
 assert.equal(go(),'https://example.test/stockzap.html#experimentar');assert.equal(go(true),'https://example.test/stockzap.html');assert.equal(go(false,false),'http://localhost:3000/app.html#dashboard');
});
