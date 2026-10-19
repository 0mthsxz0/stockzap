import {createService,HttpError} from './service.mjs';
// Business endpoints accept only the StockZap deployment namespace, loopback,
// and explicit operator-configured origins. Tokens, membership and RLS authorize data.
const env={SUPABASE_URL:Deno.env.get('SUPABASE_URL'),SUPABASE_ANON_KEY:Deno.env.get('SUPABASE_ANON_KEY'),SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')};
const origins=new Set(['https://stockzap.vercel.app','https://stockzap-git-feature-lan-162467-matheusmjcandian-1663s-projects.vercel.app',...(Deno.env.get('STOCKZAP_ALLOWED_ORIGINS')||'').split(',').map(v=>v.trim()).filter(Boolean)]);
function allowedOrigin(origin:string|null){
  if(!origin)return true;
  if(origins.has(origin))return true;
  try{
    const url=new URL(origin);if(url.origin!==origin)return false;
    if(['http:','https:'].includes(url.protocol)&&['localhost','127.0.0.1','[::1]'].includes(url.hostname))return true;
    return url.protocol==='https:'&&/^stockzap(?:-[a-z0-9]+)*-matheusmjcandian-1663s-projects\.vercel\.app$/.test(url.hostname);
  }catch{return false;}
}
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get('origin'),allowed=allowedOrigin(origin),url=new URL(req.url),health=url.pathname.split('/').at(-1)==='health';
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS',...(health?{'Access-Control-Allow-Origin':'*'}:origin&&allowed?{'Access-Control-Allow-Origin':origin}:{})};
  if(!allowed&&!health)return Response.json({error:'Este domínio não foi autorizado.'},{status:403,headers});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!['GET','POST'].includes(req.method))return Response.json({error:'Método não permitido.'},{status:405,headers});
  try {
    if(req.method==='GET'&&health)return Response.json({status:'ok',service:'stockzap-api',originAllowed:allowed,version:7},{headers});
    const raw=req.method==='POST'?await req.text():'';
    if(new TextEncoder().encode(raw).length>64000)throw new HttpError(413,'Solicitação muito grande.');
    const body=raw?JSON.parse(raw):{};
    if(body===null||typeof body!=='object'||Array.isArray(body))throw new HttpError(400,'Solicitação inválida.');
    if(req.method==='GET')body.companyId=url.searchParams.get('companyId');
    const result=await createService({env}).run(url.pathname.split('/').at(-1),req.method,req.headers.get('authorization'),body);
    return Response.json(result,{headers});
  }catch(e){
    if(!(e instanceof HttpError))console.error('StockZap request failed',e instanceof SyntaxError?'invalid-json':e?.name);
    return Response.json({error:e instanceof HttpError?e.message:'Solicitação inválida.',...(e.state?{state:e.state}:{}),...(e.needsOtp?{needsOtp:true}:{}),...(e.reference?{reference:e.reference}:{})},{status:e instanceof HttpError?e.status:400,headers});
  }
});

