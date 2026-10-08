'use strict';
const fs=require('node:fs'),path=require('node:path'),{call}=require('./devtool.cjs');
/** 真实模拟器验收使用独立模型与内存存储，原模型和存档只作前后比较。 */
const operations={
 setup:"if(sample.equipmentQA)throw Error('请先恢复上次验收');sample.equipmentQA={model:view.model,progress:view.progress,page:view.page,mapOffset:view.mapOffset,state:JSON.stringify(view.model.state),saved:GameGlobal[0].wx.getStorageSync(config.storageKey)};const E=GameGlobal[0].require('play/expedition.js').Expedition;const m=new E(config,roster,{read:()=>null,write:()=>{}});GameGlobal[0].require('play/classic-hooks.js').attach(m,roster);m.transact(()=>{m.state.meta.cleared=60;m.state.meta.diamonds=100000;for(const id of Object.keys(GameGlobal[0].require('play/equipment-upgrade-config.js').entries))m.state.meta.inventory[id]=10000;});view.handbook?.close();view.model=m;view.progress=m.progression;view.openHandbook();view.handbook.tab='equipment';view.handbook.render();return {isolated:view.model!==sample.model,count:GameGlobal[0].require('play/equipment-catalog.js').groups(m.state).flatMap(g=>g.items).length};",
 inspect:"const b=view.handbook,m=view.model;return {isolated:m!==sample.model,tab:b?.tab,offset:b?.offsets.equipment,grades:m.state.meta.equipmentGrades||{},diamonds:m.state.meta.diamonds,fragments:m.state.meta.inventory['7202'],labels:b?.modal.getComponentsInChildren(cc.Label).map(l=>l.string),originalUnchanged:sample.equipmentQA.state===JSON.stringify(sample.equipmentQA.model.state),storageUnchanged:JSON.stringify(sample.equipmentQA.saved)===JSON.stringify(GameGlobal[0].wx.getStorageSync(config.storageKey))};",
 detail:"GameGlobal[0].require('play/equipment-catalog-view.js').show(view.handbook,'7202');return true;",
 preview:"GameGlobal[0].require('play/equipment-catalog-view.js').show(view.handbook,'7003');return true;",
 restore:"const old=sample.equipmentQA;if(!old)throw Error('不存在隔离场景');if(JSON.stringify(old.model.state)!==old.state)throw Error('原模型已变化');if(JSON.stringify(old.saved)!==JSON.stringify(GameGlobal[0].wx.getStorageSync(config.storageKey)))throw Error('玩家存储已变化');view.handbook?.close();view.model=old.model;view.progress=old.progress;view.page=old.page;view.mapOffset=old.mapOffset;view.render();sample.equipmentQA=null;view.openHandbook();view.handbook.tab='equipment';view.handbook.render();return {restored:true,originalUnchanged:true,storageUnchanged:true};",
};
/** 指定操作或截图输出到 evidence，命令参数不执行任意脚本。 */
function main(){const mode=process.argv[2],root=path.resolve(__dirname,'../evidence');let result;
 if(mode==='screenshot'){result=call('simulator_screenshot');const label=process.argv[3]||'equipment-catalog';if(!/^[a-z0-9-]+$/.test(label))throw Error('无效截图名');fs.copyFileSync(result.path,path.join(root,label+'.jpg'));result={...result,path:path.join(root,label+'.jpg')};}
 else{if(!operations[mode])throw Error('未知验收步骤');result=call('automation_evaluate',{'fn-source':'function(){const sample=GameGlobal[0].__sanguoPlay;const {view,model,config,roster,cc}=sample;'+operations[mode]+'}'});fs.writeFileSync(path.join(root,'equipment-qa-'+mode+'.json'),JSON.stringify(result,null,2));}
 console.log(JSON.stringify(result));
}
if(require.main===module)main();

