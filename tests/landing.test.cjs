const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),vm=require('node:vm');
function page(hash=''){
 const nodes=new Map(),styles={},events={};class E{constructor(){this.events={};this.dataset={};this.hidden=false;this.height=96;}addEventListener(k,f){this.events[k]=f;}getBoundingClientRect(){return {height:this.height};}scrollIntoView(options){this.scrolled=options;}getAttribute(){return '#experimentar';}focus(){this.focused=true;}}
 const get=id=>{if(!nodes.has(id))nodes.set(id,new E());return nodes.get(id);};
 get('aplicativo-experimento').dataset.src='demo/public/app.html?mode=local#dashboard';
 const link=new E();link.dataset.demoRoute='zapcare';let init;
 const window={location:{hash},addEventListener:(name,fn)=>events[name]=fn,history:{pushState:(_,__,hash)=>window.location.hash=hash},matchMedia:()=>({matches:true})};
 vm.runInNewContext(fs.readFileSync('js/landing-unificada.js','utf8'),{document:{body:{style:{setProperty:(k,v)=>styles[k]=v}},addEventListener:(_,f)=>init=f,getElementById:get,querySelector:()=>get('header'),querySelectorAll:()=>[link]},window,requestAnimationFrame:fn=>fn()});init();
 return {get,link,styles,events,window};
}
test('experimento só carrega ao iniciar e mantém o mesmo iframe ao recolher',()=>{
 const p=page(),frame=p.get('aplicativo-experimento');assert.equal(frame.src,undefined);
 p.get('iniciar-experimento').events.click();assert.equal(frame.src,'demo/public/app.html?mode=local#dashboard');assert.equal(frame.hidden,false);
 p.get('fechar-experimento').events.click();assert.equal(frame.hidden,true);
 p.get('iniciar-experimento').events.click();assert.equal(frame.hidden,false);assert.equal(frame.src,'demo/public/app.html?mode=local#dashboard');
});
test('link do ZapCare abre a rota correta na mesma página',()=>{const p=page();p.link.events.click({preventDefault(){}});assert.equal(p.get('aplicativo-experimento').src,'demo/public/app.html?mode=local#zapcare');});
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

test('âncora é posicionada no início e cabeçalho variável atualiza o deslocamento',()=>{
 const p=page();p.link.events.click({preventDefault(){}});
 assert.equal(p.window.location.hash,'#experimentar');assert.equal(p.get('experimentar').scrolled.block,'start');
 p.get('header').height=184;p.events.resize();assert.equal(p.styles['--header-height'],'184px');
});
test('uma única experimentação e acesso às seis páginas de funcionalidades',()=>{
 const html=fs.readFileSync('stockzap.html','utf8');assert.equal((html.match(/<iframe/g)||[]).length,1);
 assert.ok(!html.includes('hero-preview'));assert.ok(!html.includes('site-chat-preview'));
 for(const name of ['produtos','estoque','dashboard','financeiro','prazos','equipe'])assert.ok(html.includes('href="html/infos_landingpage/info'+name+'.html"'));
 assert.ok(html.indexOf('id="solucao"')<html.indexOf('id="funcionalidades"'));assert.ok(html.indexOf('id="funcionalidades"')<html.indexOf('id="experimentar"'));
});
test('cores principais de texto e botões atingem contraste AA',()=>{
 function luminance(hex){const c=hex.match(/../g).map(v=>parseInt(v,16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);return .2126*c[0]+.7152*c[1]+.0722*c[2];}
 for(const [fg,bg] of [['4b5f75','ffffff'],['ffffff','087840'],['075c34','f7faf8'],['d0dfef','071e40']]){const a=luminance(fg),b=luminance(bg);assert.ok((Math.max(a,b)+.05)/(Math.min(a,b)+.05)>=4.5,fg+' / '+bg);}
});
