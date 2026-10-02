'use strict';
const fs=require('node:fs'),path=require('node:path'),{call}=require('./devtool.cjs');
/** 记录真实模拟器中的只读验收状态，同时比较局内与局外数据。 */
function main(){const mode=process.argv[2]||'inspect',operations={
 baseline:"sample.portraitBaseline=JSON.stringify({battle:model.state,progress:view.progress.state});return {baseline:true};",
 inspect:"const b=view.handbook;return {page:view.page,mapOffset:view.mapOffset,open:!!b?.modal?.isValid,tab:b?.tab,selected:b?.selected,offsets:b?.offsets,unchanged:sample.portraitBaseline===JSON.stringify({battle:model.state,progress:view.progress.state}),errors:sample.denied};",
 textures:"const rows=view.handbook.book.config.heroes,images=[];for(const h of rows){const t=await view.assets.texture(h.portrait);images.push({id:h.id,width:t.width,height:t.height});}const a=await view.assets.texture('zhangfei-avatar.png'),b=await view.assets.texture(rows.find(h=>h.id==='zhangfei').portrait);return {images,sameZhangfeiTexture:a===b,unchanged:sample.portraitBaseline===JSON.stringify({battle:model.state,progress:view.progress.state})};"
 };if(!operations[mode])throw Error('未知验收项');const result=call('automation_evaluate',{'fn-source':'async function(){const sample=GameGlobal[0].__sanguoPlay;const {view,model}=sample;'+operations[mode]+'}'});fs.writeFileSync(path.join(__dirname,'../evidence/portrait-qa-'+mode+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
main();
