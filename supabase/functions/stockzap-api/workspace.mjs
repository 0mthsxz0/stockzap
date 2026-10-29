'use strict';
function today(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(now);
}
function emptyWorkspace(user, name) {
  const owner=String(user.user_metadata?.nome||user.user_metadata?.name||user.email?.split('@')[0]||'Responsável').trim().slice(0,140)||'Responsável';
  const company=String(name||user.user_metadata?.empresa||user.user_metadata?.company||'Minha empresa').trim().slice(0,140)||'Minha empresa';
  return {schema:1,revision:1,asOf:today(),company:{name:company,owner,email:user.email||'',phone:'Não informado',address:'Não informado',segment:'Comércio',monthlyGoal:10000,openingBalance:0,description:'',businessHours:'Não informado'},products:[],suppliers:[{id:'s-default',name:'Fornecedor não informado',contact:'',phone:'',email:'',leadDays:0}],customers:[{id:'c-default',name:'Consumidor final',phone:'Não informado',email:'',address:'',notes:''}],team:[{id:'e-owner',name:owner,role:'Proprietário(a)',area:'Gestão',email:user.email||'',phone:'',status:'Ativo'}],orders:[],transactions:[],tasks:[],movements:[],conversations:[],activity:[],onboarding:{}};
}
export {today,emptyWorkspace};

