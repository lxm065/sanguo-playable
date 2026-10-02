'use strict';
const fs=require('node:fs'),path=require('node:path'),{call}=require('./devtool.cjs');
/** 在真实模拟器中设置只读UI验收场景；完整玩家状态用于前后比对。 */
function main(){const mode=process.argv[2]||'inspect';const operations={
 baseline:"sample.handbookBaseline=JSON.stringify(model.state);return {page:view.page,unchanged:true};",
 inspect:"const b=view.handbook;return {page:view.page,mapOffset:view.mapOffset,open:!!b?.modal?.isValid,tab:b?.tab,selected:b?.selected,offsets:b?.offsets,unchanged:sample.handbookBaseline===JSON.stringify(model.state),errors:sample.denied};",
 map:"view.handbook?.close();view.page='map';view.mapOffset=-410;view.render();return {page:view.page,mapOffset:view.mapOffset};",
 home:"view.handbook?.close();view.page='home';view.render();return {page:view.page};",
 };if(!operations[mode])throw Error('未知验收场景');const result=call('automation_evaluate',{'fn-source':'function(){const sample=GameGlobal[0].__sanguoPlay;const {view,model}=sample;'+operations[mode]+'}'});const file=path.resolve(__dirname,'../evidence/handbook-qa-'+mode+'.json');fs.writeFileSync(file,JSON.stringify(result,null,2));console.log(JSON.stringify(result));}
main();
