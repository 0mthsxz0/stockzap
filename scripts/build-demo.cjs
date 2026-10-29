'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..');
function generate(){
 const logo='data:image/svg+xml;base64,'+fs.readFileSync(path.join(root,'imagens/StockZap_logo.svg')).toString('base64');
 const modules=['demo','core','zapcare','ui','views','app'];
 const source=fs.readFileSync(path.join(root,'js/site.js'),'utf8').replace(/\r\n/g,'\n')+';\n'+modules.map(name=>fs.readFileSync(path.join(root,'js/erp',name+'.js'),'utf8').replace(/\r\n/g,'\n')).join(';\n').replaceAll('imagens/StockZap_logo.svg',logo);
 const script=esbuild.transformSync(source,{minify:true,target:'es2022',charset:'utf8',legalComments:'none'}).code.replace(/<\/script/gi,'<\\/script');
 const hash=crypto.createHash('sha256').update(script).digest('base64');
 const css=['fonts','tokens','app','app-integration'].map(name=>fs.readFileSync(path.join(root,'css',name+'.css'),'utf8').replace(/\r\n/g,'\n').replace(/@import\s+url\([^)]*\);?/g,'')).join('\n');
 const policy="default-src 'none'; script-src 'sha256-"+hash+"'; style-src 'unsafe-inline'; img-src data: blob:; font-src 'none'; connect-src 'none'; base-uri 'none'; object-src 'none'; form-action 'none'";
 return '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="'+policy+'"><meta name="stockzap-demo" content="self-contained-v1"><meta name="robots" content="noindex,nofollow"><meta name="referrer" content="no-referrer"><title>Demonstração · StockZap</title><style>'+css+'</style></head><body data-demo="true"><a class="app-skip" href="#page-content">Pular para o conteúdo</a><div id="app"><div class="loading-screen"><div class="loading-content"><img class="logo" src="'+logo+'" alt="StockZap"><p class="muted">Preparando o Empório Aurora…</p><span class="spinner" role="status" aria-label="Carregando"></span></div></div></div><div id="modal-root"></div><div id="chat-root"></div><div id="toasts" class="toast-container" aria-live="polite"></div><noscript>Ative o JavaScript para explorar a demonstração.</noscript><script>'+script+'</script></body></html>\n';
}
function write(){fs.writeFileSync(path.join(root,'demo.html'),generate());}
module.exports={generate,write};if(require.main===module)write();
