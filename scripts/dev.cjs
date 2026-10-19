'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
execFileSync(process.execPath,[path.join(__dirname,'build.cjs')],{stdio:'inherit'});
const config=require('../vercel.json'),base=path.join(root,'dist');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);return res.end();}
  let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400);return res.end();}
  for(const rule of config.headers||[])if(new RegExp('^'+rule.source+'$').test(name))for(const h of rule.headers)res.setHeader(h.key,h.value);
  if(name==='/demo'||name.startsWith('/demo/')){res.writeHead(302,{Location:'/#demo'});return res.end();}
  if(name==='/')name='/index.html';
  const file=path.resolve(base,'.'+name);
  if(!file.startsWith(base+path.sep)){res.writeHead(403);return res.end();}
  if(!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404,{'Content-Type':'text/html; charset=utf-8'});return res.end(fs.readFileSync(path.join(base,'404.html')));}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');
  if(req.method==='HEAD')return res.end();
  fs.createReadStream(file).pipe(res);
});
const port=Number(process.env.PORT)||3000;
server.listen(port,'0.0.0.0',()=>console.log('StockZap em http://localhost:'+port));
