'use strict';
const fs=require('node:fs'),path=require('node:path'),esbuild=require('esbuild');
const root=path.resolve(__dirname,'..'),out=path.join(root,'dist');
require('./sync-core.cjs').sync();
fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
const files=['index.html','stockzap.html','app.html','login.html','cadastro.html','recuperar-senha.html','redefinir-senha.html','privacidade.html','termos.html','404.html'];
for(const file of files)fs.copyFileSync(path.join(root,file),path.join(out,file));
for(const folder of ['css','imagens','auth','html'])fs.cpSync(path.join(root,folder),path.join(out,folder),{recursive:true});
fs.mkdirSync(path.join(out,'js'),{recursive:true});
for(const file of ['landing.js','stockzap-auth.js','auth-forms.js'])fs.copyFileSync(path.join(root,'js',file),path.join(out,'js',file));
fs.cpSync(path.join(root,'js','erp'),path.join(out,'js','erp'),{recursive:true});
esbuild.buildSync({stdin:{contents:"import * as supabase from '@supabase/supabase-js'; window.supabase=supabase;",resolveDir:root},bundle:true,minify:true,platform:'browser',format:'iife',target:['es2022'],legalComments:'eof',outfile:path.join(out,'js','supabase-vendor.js')});
// The old local-only scripts, demo server, tests and backend sources are never deployed as public assets.
console.log('Build concluído: dist/');
