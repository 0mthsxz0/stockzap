'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),O=require('../js/erp/onboarding.js');
const answers=()=>Object.fromEntries(O.flow().map(key=>[key,O.questions[key].tipo==='multi'?[O.questions[key].opcoes[0].id]:O.questions[key].opcoes[0].id]));
test('reutiliza 11 etapas antigas e abre insumos e receitas apenas para produção própria',()=>{
 assert.equal(O.flow().length,11);const production={...answers(),oferta:'producao',insumos:'sim',receita:'nao'};assert.equal(O.flow(production).length,13);assert.ok(O.complete({version:1,completed:true,answers:production}));
 production.oferta='servicos';const cleaned=O.clean(production);assert.equal(cleaned.insumos,undefined);assert.equal(cleaned.receita,undefined);assert.equal(O.rows(cleaned).length,11);
});
test('conclusão exige todas as respostas válidas e versão conhecida',()=>{
 const a=answers();assert.equal(O.complete({version:1,completed:true,answers:a}),true);delete a.canais;
 assert.equal(O.complete({version:1,completed:true,answers:a}),false);assert.equal(O.complete({version:1,completed:false,answers:answers()}),false);assert.equal(O.complete({version:2,completed:true,answers:answers()}),false);assert.equal(O.complete({}),false);
});
test('normaliza seleção múltipla e não exibe texto arbitrário no perfil',()=>{
 const a={...answers(),canais:['site','site','<script>'],segmento:'<img>',extra:'injetado'};const cleaned=O.clean(a);assert.deepEqual(cleaned.canais,['site']);assert.equal(cleaned.extra,undefined);assert.equal(cleaned.segmento,undefined);
 assert.ok(O.rows(a).some(row=>row.key==='segmento'&&row.answer==='Não respondido'));assert.ok(O.rows(a).some(row=>row.key==='canais'&&row.answer==='Site'));
});

test('prioridades preservam a ordem escolhida e respostas antigas continuam válidas',()=>{
 const ranked=O.clean({...answers(),prioridade:['financeiro','estoque','vendas','financeiro','invalido']});
 assert.deepEqual(ranked.prioridade,['financeiro','estoque','vendas']);
 assert.equal(O.rows(ranked).find(row=>row.key==='prioridade').answer,'1. Financeiro · 2. Estoque · 3. Vendas');
 const legacy={...answers(),prioridade:'financeiro'};
 assert.deepEqual(O.clean(legacy).prioridade,['financeiro']);assert.equal(O.complete({version:1,completed:true,answers:legacy}),true);
 assert.equal(O.complete({version:1,completed:true,answers:{...answers(),prioridade:[]}}),false);
});
