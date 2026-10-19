'use strict';
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
require('./sync-core.cjs').sync();
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const files=['index.html','stockzap.html','app.html','demo.html','login.html','cadastro.html','recuperar-senha.html','redefinir-senha.html','privacidade.html','termos.html','404.html'];
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
for(const folder of ['css','imagens','auth','html'])fs.cpSync(path.join(root,folder),path.join(out,folder),{recursive:true});
fs.mkdirSync(path.join(out,'js'),{recursive:true});
for(const file of ['landing.js','stockzap-auth.js','auth-forms.js'])fs.copyFileSync(path.join(root,'js',file),path.join(out,'js',file));
fs.cpSync(path.join(root,'js','erp'),path.join(out,'js','erp'),{recursive:true});
const bundle=esbuild.buildSync({metafile:true,banner:{js:"/*! Supabase JS and bundled dependencies. Licenses: /js/supabase-vendor.LICENSE.txt */"},stdin:{contents:"import * as supabase from '@supabase/supabase-js'; window.supabase=supabase;",resolveDir:root},bundle:true,minify:true,platform:'browser',format:'iife',target:['es2022'],legalComments:'eof',outfile:path.join(root,'js','supabase-vendor.js')});
fs.copyFileSync(path.join(root,'js','supabase-vendor.js'),path.join(out,'js','supabase-vendor.js'));
const packages=new Set(Object.keys(bundle.metafile.inputs).filter(p=>p.startsWith('node_modules/')).map(p=>{const parts=p.split('/');return parts.slice(0,parts[1].startsWith('@')?3:2).join('/');}));
const notices=[...packages].sort().map(pkg=>{
  const dir=path.join(root,pkg),meta=JSON.parse(fs.readFileSync(path.join(dir,'package.json'),'utf8'));
  const license=fs.readdirSync(dir).find(name=>/^license(?:\.(?:md|txt))?$/i.test(name));
  if(!license)throw new Error('Licença ausente no pacote: '+meta.name);
  return meta.name+' '+meta.version+'\n'+fs.readFileSync(path.join(dir,license),'utf8');
}).join('\n\n---\n\n');
fs.writeFileSync(path.join(root,'js','supabase-vendor.LICENSE.txt'),notices);
fs.writeFileSync(path.join(out,'js','supabase-vendor.LICENSE.txt'),notices);
// The old local-only scripts, demo server, tests and backend sources are never deployed as public assets.
console.log('Build concluído: dist/');
