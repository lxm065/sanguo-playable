'use strict';
/** 首次获得局内装备时登记教学；旧局已有装备不额外补播。调用方负责事务。 */
function acquired(model,item){const m=model.state.meta;if(!m||m.equipmentTutorial)return;m.equipmentTutorial={done:model.state.expedition.equipment.length>1,item:item.uid,voiced:false};}
/** 只在真实穿戴成功后完成教学，卸下和失败不消耗教学。 */
function equipped(model,owner){if(owner!==null&&model.state.meta?.equipmentTutorial)model.state.meta.equipmentTutorial.done=true;}
/** 第一章重开清除教学记忆，其他章节重开仍保持已完成状态。 */
function reset(meta){if(meta.chapter===require('./tutorial-config').equipment.resetChapter)delete meta.equipmentTutorial;}
/** 在可操作的战斗准备区寻找可穿戴且显示中的推荐对象。 */
function target(v){const m=v.model,t=m.state.meta?.equipmentTutorial;if(!t||t.done||m.state.pending||v.playing)return null;const equipment=m.state.expedition.equipment,item=equipment.find(e=>e.uid===t.item&&e.owner===null);if(!item)return null;const from=v.root.getChildByName('equipment-inventory')?.getChildByName('equipment-drag-'+item.uid);if(!from)return null;const available=m.state.units.filter(u=>v.actors.has(u.uid)&&equipment.filter(e=>e.owner===u.uid).length<require('./expedition-config').equipmentLimit),recommended=require('./battle-hud-query').recommendedUnits(item,available,equipment),unit=available.find(u=>recommended.includes(u.uid)&&u.slot>=0)||available.find(u=>recommended.includes(u.uid))||available.find(u=>u.slot>=0)||available[0];return unit?{item,unit,from}:null;}
module.exports={acquired,equipped,reset,target};
