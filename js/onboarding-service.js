/* O banco é a fonte da conclusão. Cache local serve apenas à apresentação do perfil. */
(function(root){
 'use strict';
 const C=typeof module!=='undefined'&&module.exports?require('./onboarding-core.js'):root.StockZapOnboarding;
 function cache(storage,user,config){try{storage?.setItem(`stockzap:usuario:${user.id}:perfil-zapchat:v1`,JSON.stringify(config));}catch(_) {}}
 async function load(client,user,storage){
  const {data,error}=await client.from('respostas_zapchat').select('respostas').eq('usuario_id',user.id).order('created_at',{ascending:false}).limit(1).maybeSingle();
  if(error)throw new Error('Não foi possível consultar a personalização. Confira a conexão e tente novamente.');
  if(!data||!C.valid(data.respostas))return null;
  const config=C.configuration(data.respostas);cache(storage,user,config);return config;
 }
 async function save(client,user,answers,storage){
  const clean=C.clean(answers);
  const auth=await client.auth.getUser();
  if(auth.error||auth.data?.user?.id!==user.id)throw new Error('Sua sessão mudou. Entre novamente.');
  const {data,error}=await client.from('respostas_zapchat').insert({usuario_id:user.id,respostas:clean}).select('respostas').single();
  if(error||!data||!C.valid(data.respostas))throw new Error('Não foi possível salvar seu perfil.');
  const config=C.configuration(data.respostas);cache(storage,user,config);return config;
 }
 const api={load,save};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.StockZapOnboardingService=api;
})(typeof window!=='undefined'?window:globalThis);
