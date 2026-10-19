'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
function harness(){
 let editing=false,resolveState,submitted;
 const deferred=new Promise(resolve=>{resolveState=resolve;});let stateRequests=0;
 const node={innerHTML:'',replaceChildren(){},addEventListener(){},querySelector(){return null;}};
 const window={SZCore:{money:()=>'',alerts:()=>[]},SZUI:{esc:String,icon:()=>'',date:()=>'',badge:()=>'',statusBadge:()=>'',initials:()=>'',applyTheme(){}},SZViews:{},StockZapAuth:{request:async(path,options)=>{if(path==='state'){stateRequests++;return deferred;}if(path==='action'){submitted=options.body;return {state:{revision:submitted.revision+1}};}},client:()=>({auth:{onAuthStateChange(){}}})},addEventListener(){},scrollTo(){}};window.parent=window;
 const document={hidden:false,body:{dataset:{}},getElementById:()=>node,querySelector:selector=>editing&&selector.includes('#modal-overlay')?node:null,addEventListener(){}};
 const context={window,document,location:{search:'',hash:'',replace(){}},URLSearchParams,localStorage:{getItem(){return null;}},setInterval(){},setTimeout(){},matchMedia:()=>({addEventListener(){}})};
 const source=fs.readFileSync(require.resolve('../js/erp/app.js'),'utf8').replace('  init();','  window.harness={refresh,perform,setState:s=>{state=s;},getState:()=>state};');
 vm.runInNewContext(source,context);
 window.harness.setState({revision:1});
 return {...window.harness,setEditing:v=>{editing=v;},resolveState,stateRequests:()=>stateRequests,submitted:()=>submitted};
}
test('edição aberta mantém a revisão original para rejeitar sobrescritas',async()=>{
 const h=harness();h.setEditing(true);await h.refresh();await h.perform('product.save',{name:'Original'},{render:false,toast:false});
 assert.equal(h.stateRequests(),0);assert.equal(h.submitted().revision,1);
});
test('formulário aberto com consulta em andamento descarta a resposta antiga',async()=>{
 const h=harness(),refresh=h.refresh();h.setEditing(true);h.resolveState({state:{revision:2}});await refresh;
 await h.perform('product.save',{name:'Original'},{render:false,toast:false});assert.equal(h.submitted().revision,1);
});
test('consulta lenta não regride a revisão de uma gravação já concluída',async()=>{
 const h=harness(),refresh=h.refresh();h.setState({revision:3});h.resolveState({state:{revision:2}});await refresh;assert.equal(h.getState().revision,3);
});
test('regras da demonstração e da API são geradas da mesma fonte',()=>{
 for(const item of require('../scripts/sync-core.cjs').outputs())assert.equal(fs.readFileSync(item.file,'utf8').replace(/\r\n/g,'\n'),item.content);
});
