'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function edge(){
 let handler;
 const source=fs.readFileSync(path.join(root,'supabase/functions/stockzap-api/index.ts'),'utf8').replace(/^import .*\r?\n/,'').replace('(req:Request)','(req)');
 class HttpError extends Error{}
 vm.runInNewContext(source,{Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}},Response,URL,TextEncoder,Set,console,HttpError,createService:()=>({run:()=>{const e=new HttpError('Entre na sua conta.');e.status=401;throw e;}})});
 return handler;
}
test('scripts de autenticação existem também no código servido pelo VSCode',()=>{
 for(const file of ['login.html','cadastro.html','app.html','auth/callback.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const [,src]of html.matchAll(/<script src="([^"]+)"/g))assert.ok(fs.existsSync(path.join(root,src)),file+': script ausente '+src);
 }
});
test('origens exatas da prévia e do Live Server podem negociar o acesso',async()=>{
 for(const origin of ['https://stockzap-git-feature-lan-162467-matheusmjcandian-1663s-projects.vercel.app','http://localhost:5500','http://127.0.0.1:5500']){
  const res=await edge()(new Request('https://edge.test/legal-status',{method:'OPTIONS',headers:{origin}}));
  assert.equal(res.status,204,origin);assert.equal(res.headers.get('Access-Control-Allow-Origin'),origin);
 }
});
test('CORS não libera domínios parecidos nem substitui autenticação',async()=>{
 for(const origin of ['https://stockzap.vercel.app.evil.test','https://arbitrary.vercel.app','null']){
  const res=await edge()(new Request('https://edge.test/state',{method:'OPTIONS',headers:{origin}}));assert.equal(res.status,403);assert.equal(res.headers.get('Access-Control-Allow-Origin'),null);
 }
 const res=await edge()(new Request('https://edge.test/state',{headers:{origin:'https://stockzap.vercel.app'}}));assert.equal(res.status,401);
});
