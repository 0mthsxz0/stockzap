import {createService,HttpError} from './service.mjs';
const env={SUPABASE_URL:Deno.env.get('SUPABASE_URL'),SUPABASE_ANON_KEY:Deno.env.get('SUPABASE_ANON_KEY'),SUPABASE_SERVICE_ROLE_KEY:Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')};
const origins=new Set(['https://stockzap.vercel.app','http://localhost:3000','http://127.0.0.1:3000','http://localhost:4173','http://127.0.0.1:4173']);
Deno.serve(async(req:Request)=>{
  const origin=req.headers.get('origin');
  const headers={'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Vary':'Origin','Access-Control-Allow-Headers':'authorization, apikey, content-type, x-client-info','Access-Control-Allow-Methods':'GET, POST, OPTIONS',...(origin&&origins.has(origin)?{'Access-Control-Allow-Origin':origin}:{})};
  if(origin&&!origins.has(origin))return Response.json({error:'Origem não permitida.'},{status:403,headers});
  if(req.method==='OPTIONS')return new Response(null,{status:204,headers});
  if(!['GET','POST'].includes(req.method))return Response.json({error:'Método não permitido.'},{status:405,headers});
  try {
    const url=new URL(req.url);const raw=req.method==='POST'?await req.text():'';
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

