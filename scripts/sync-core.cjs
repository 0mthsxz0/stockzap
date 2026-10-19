'use strict';
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
function outputs(){
  return [['core','SZCore'],['zapcare','SZCare']].map(([name,global])=>{
    let source=fs.readFileSync(path.join(root,'supabase','functions','stockzap-api',name+'.mjs'),'utf8').replace(/\r\n/g,'\n');
    source=source.replace("import './core.mjs';\n",'');
    source=source.slice(0,source.lastIndexOf('\nexport const'));
    return {file:path.join(root,'js','erp',name+'.js'),content:'/* Gerado do módulo da API. Execute npm run sync-core para atualizar. */\n'+source+"\nif(typeof module!=='undefined')module.exports=globalThis."+global+';\n'};
  });
}
function sync(){for(const item of outputs())fs.writeFileSync(item.file,item.content.replace(/\n/g,'\r\n'));}
module.exports={outputs,sync};if(require.main===module)sync();
