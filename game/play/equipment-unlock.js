'use strict';
const policy=require('./equipment-activation-config');
/** 永久激活或已有进阶等级沿用资格；章节和碎片仅用于首次开放入口。 */
function status(item,state){
 const meta=state.meta||{},rule=item.unlock,fragments=meta.inventory?.[item.id]||0;
 const activated=!!item.grade||!!meta.equipmentUpgradeUnlocked?.includes(item.id);
 let condition='',eligible=false;
 switch(rule.kind){
  case policy.kinds.default:eligible=true;break;
  case policy.kinds.chapter:condition='通关远征第'+rule.value+'章可进阶';eligible=(meta.cleared||0)>=rule.value;break;
  case policy.kinds.dungeon:condition='通关英雄副本第'+rule.value+'章可进阶';eligible=policy.dungeonEnabled&&(meta.heroDungeonCleared||0)>=rule.value;break;
  case policy.kinds.fragments:condition='获得'+rule.value+'个碎片可进阶';eligible=fragments>=rule.value;break;
 }
 eligible=activated||eligible||fragments>=policy.fragmentAlternative;
 return {activated,eligible,locked:!eligible,condition,needsUnlock:!activated&&eligible};
}
/** 兼容查询入口，仅对达标且未激活的装备显示一次性视频。 */
function available(item,state){return status(item,state).needsUnlock;}
/** 完整视频回调重新校验条件并永久激活；不扣材料、不直接增加阶级。 */
function unlock(model,id,ticket){return model.transact(()=>{
 model.editable();const q=require('./equipment-catalog').query(id,model.state);
 if(model.state.pending||!q.active||!q.needsUnlock)throw Error('装备进阶已解锁或条件变化');
 if(policy.activationVideo)model.consumeAd(ticket);
 const meta=model.state.meta;meta.equipmentUpgradeUnlocked=[...(meta.equipmentUpgradeUnlocked||[]),id];
});}
module.exports={status,available,unlock};
