'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
function edge(){
 let handler;
 const source=fs.readFileSync(path.join(root,'supabase/functions/stockzap-api/index.ts'),'utf8').replace(/^import .*\r?\n/,'').replace('(req:Request)','(req)').replace('(origin:string|null)','(origin)');
 class HttpError extends Error{}
 vm.runInNewContext(source,{Deno:{env:{get:()=>''},serve:fn=>{handler=fn;}},Response,URL,TextEncoder,Set,console,HttpError,createService:()=>({run:()=>{const e=new HttpError('Entre na sua conta.');e.status=401;throw e;}})});
 return handler;
}
test('scripts de autenticação existem também no código servido pelo VSCode',()=>{
 for(const file of ['login.html','cadastro.html','app.html','auth/callback.html']){
  const html=fs.readFileSync(path.join(root,file),'utf8');
  for(const [,src]of html.matchAll(/<script src="([^"]+)"/g))assert.ok(fs.existsSync(path.resolve(root,path.dirname(file),src)),file+': script ausente '+src);
 }
});
test('origens de prévia e portas locais negociam sem cookies',async()=>{
 for(const origin of ['https://stockzap-git-feature-lan-162467-matheusmjcandian-1663s-projects.vercel.app','http://localhost:5500','http://127.0.0.1:5500','http://localhost:5173','https://stockzap-a123b4-matheusmjcandian-1663s-projects.vercel.app']){
  const res=await edge()(new Request('https://edge.test/legal-status',{method:'OPTIONS',headers:{origin}}));
  assert.equal(res.status,204,origin);assert.equal(res.headers.get('Access-Control-Allow-Origin'),origin);assert.equal(res.headers.get('Access-Control-Allow-Credentials'),null);
 }
});
test('outros domínios são recusados e origens confiáveis não dispensam token',async()=>{
 for(const origin of ['https://foreign.test','null','https://stockzap-a123b4-attacker.vercel.app','https://stockzap-a123b4-matheusmjcandian-1663s-projects.vercel.app.evil.test']){
  const res=await edge()(new Request('https://edge.test/state',{headers:{origin}}));assert.equal(res.status,403);assert.equal(res.headers.get('Access-Control-Allow-Origin'),null);
 }
 const denied=await edge()(new Request('https://edge.test/state',{headers:{origin:'http://localhost:5173'}}));assert.equal(denied.status,401);
 const health=await edge()(new Request('https://edge.test/health',{headers:{origin:'https://foreign.test'}}));assert.equal(health.status,200);assert.equal((await health.json()).originAllowed,false);
});
