/* Indicadores do catálogo local. Não estima vendas sem registros de venda. */
(function (root) {
 "use strict";
 function summarize(items) {
  const low = items.filter(p => p.estoque <= p.estoqueMinimo).sort((a,b) => a.estoque-b.estoque);
  const categories = new Map();
  for (const p of items) categories.set(p.categoria, (categories.get(p.categoria)||0)+p.estoque);
  return { total:items.length, units:items.reduce((n,p)=>n+p.estoque,0), low,
   value:items.reduce((n,p)=>n+p.preco*p.estoque,0), categories:[...categories].sort((a,b)=>a[0].localeCompare(b[0],'pt-BR')) };
 }
 function profile(raw) {
  if (!raw) return null;
  const parsed=JSON.parse(raw);
  const p=parsed?.perfil;
  if (!p || typeof p!=='object') throw new Error('Perfil inválido.');
  const fields=['operacao','segmento','oferta','maturidade','prioridade'];
  for (const field of fields) if (typeof p[field]!=='string' || !p[field].trim() || p[field].length>160) throw new Error('Perfil inválido.');
  return Object.fromEntries(fields.map(field=>[field,p[field]]));
 }
 const api={summarize,profile};
 if (typeof module!=='undefined'&&module.exports) module.exports=api; else root.StockZapDashboard=api;
})(typeof window!=='undefined'?window:globalThis);
