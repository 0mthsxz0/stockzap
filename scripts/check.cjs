'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(path.join(dir,x.name)):[path.join(dir,x.name)]);
for(const file of [...walk(path.join(root,'js','erp')),path.join(root,'js','landing.js'),path.join(root,'js','stockzap-auth.js'),path.join(root,'js','auth-forms.js'),...walk(path.join(root,'supabase','functions'))].filter(f=>/\.(js|mjs)$/.test(f)))execFileSync(process.execPath,['--check',file],{stdio:'pipe'});
const output=path.join(root,'dist');
if(!fs.existsSync(output))throw new Error('Execute npm run build antes de npm run check.');
let htmlCount=0;
for(const file of walk(output).filter(f=>f.endsWith('.html'))){
  const html=fs.readFileSync(file,'utf8');htmlCount++;
  for(const match of html.matchAll(/(?:href|src)="([^"]+)"/g)){
    if(/^(https?:|#|data:|blob:|mailto:)/.test(match[1]))continue;
    const url=new URL(match[1],'https://stockzap.test/'+path.relative(output,file));
    const dest=path.join(output,url.pathname==='/'?'index.html':url.pathname);
    if(!fs.existsSync(dest))throw new Error(path.relative(root,file)+': referência ausente '+match[1]);
  }
  if(/<script(?![^>]*\bsrc=)[^>]*>\s*\S/.test(html))throw new Error('Script inline incompatível com a CSP em '+file);
  if(!html.includes('lang="pt-BR"')||!html.includes('name="viewport"'))throw new Error('Faltam metadados de acessibilidade em '+file);
}
const vendor=fs.readFileSync(path.join(output,'js','supabase-vendor.js'),'utf8');
if(/sb_secret_|service_role/.test(fs.readFileSync(path.join(root,'js','stockzap-auth.js'),'utf8')))throw new Error('Credencial indevida no cliente.');
if(!vendor.length)throw new Error('SDK não empacotado.');
for(const forbidden of ['demo','supabase','node_modules','tests','scripts'])if(fs.existsSync(path.join(output,forbidden)))throw new Error('Fonte privada no build: '+forbidden);
console.log('Sintaxe, CSP, assets e '+htmlCount+' páginas verificados.');
