'use strict';
/** 常用低阶装备可提前看视频解锁；通关首章后自动开放，旧有强化等级也保留资格。 */
function available(item,state){return item.requiredChapter===0&&(state.meta?.cleared||0)<1&&!item.grade&&!state.meta?.equipmentUpgradeUnlocked?.includes(item.id);}
/** 完整视频回调只永久开启指定装备强化，重复与过期回调不能重复消费。 */
function unlock(model,id,ticket){return model.transact(()=>{model.editable();const q=require('./equipment-catalog').query(id,model.state);if(!q.needsUnlock)throw Error('装备进阶已解锁或条件变化');model.consumeAd(ticket);const m=model.state.meta;m.equipmentUpgradeUnlocked=[...(m.equipmentUpgradeUnlocked||[]),id];});}
module.exports={available,unlock};
