'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.json':'application/json; charset=utf-8','.txt':'text/plain; charset=utf-8'};
function serve({mount='/',protectedPreview=false}={}){
 const blocked=[],requests=[],config=JSON.parse(fs.readFileSync(path.join(root,'vercel.json'),'utf8'));
 const server=http.createServer((req,res)=>{
  const url=new URL(req.url,'http://localhost'),pathname=url.pathname;requests.push(pathname);
  if(pathname==='/authorize-preview'){res.writeHead(302,{'Set-Cookie':'preview_access=approved; SameSite=Lax; HttpOnly; Path=/','Location':mount});return res.end();}
  if(pathname==='/preview-login'){res.setHeader('Content-Type','text/html');return res.end('<h1>Preview authentication required</h1>');}
  if(protectedPreview&&!req.headers.cookie?.includes('preview_access=approved')){blocked.push(pathname);res.writeHead(302,{Location:'/preview-login'});return res.end();}
  if(!pathname.startsWith(mount)){res.writeHead(404);return res.end('Outside site mount');}
  let relative;try{relative='/'+decodeURIComponent(pathname.slice(mount.length));}catch{res.writeHead(400);return res.end();}
  if(relative==='/')relative='/index.html';
  for(const rule of config.headers||[])if(new RegExp('^'+rule.source+'$').test(relative))for(const h of rule.headers)res.setHeader(h.key,h.value);
  const base=path.join(root,'dist'),file=path.resolve(base,'.'+relative);
  if(!file.startsWith(base+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end('Not found');}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));
 });
 return new Promise(resolve=>server.listen(0,'0.0.0.0',()=>resolve({server,blocked,requests,url:'http://localhost:'+server.address().port,mount,close:()=>new Promise(r=>server.close(r))})));
}
module.exports={serve};
