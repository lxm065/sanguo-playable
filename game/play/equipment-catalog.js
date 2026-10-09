'use strict';
const entries=require('./equipment-catalog-data'),config=require('./equipment-catalog-config'),upgrades=require('./equipment-upgrades'),upgradeConfig=require('./equipment-upgrade-config');
/** 查询所有装备，实际开放性只由战斗配置决定，预览不会变成战斗奖励。 */
function query(id,state={}){
 const entry=entries.find(e=>e.id===id);if(!entry)throw Error('未知装备：'+id);
 const definition=require('./expedition-config').equipment.find(e=>e.id===id),meta=state.meta||{},level=upgrades.grade(id,meta.equipmentGrades),steps=upgrades.lines(id),chapter=Math.max(entry.unlock.kind===1?Math.min(entry.unlock.value,require('./equipment-access-config').firstGradeCap):0,require('./equipment-chapter-config')[id]?.[level]||0);
 const max=!!definition&&level>=steps.length,fragments=meta.inventory?.[id]||0,cost=max||!definition?null:{fragments:upgradeConfig.fragmentCosts[level],diamonds:upgradeConfig.diamondCosts[level]};
 const condition=chapter?'通关远征第'+chapter+'章可进阶':'';
 const needsUnlock=!!definition&&require('./equipment-unlock').available({...entry,grade:level,requiredChapter:chapter},state);
 const reason=!definition?config.text.unavailable:max?config.text.max:(meta.cleared||0)<chapter?condition:state.pending?config.text.pending:needsUnlock?'观看视频解锁进阶':fragments<cost.fragments?config.text.noFragments:(meta.diamonds||0)<cost.diamonds?config.text.noDiamonds:'';
 return {...entry,...require('./equipment-theme')[id],active:!!definition,revealed:!!definition&&require('./equipment-discovery').known(state).includes(id),grade:level,max,fragments,cost,condition,requiredChapter:chapter,needsUnlock,reason,canUpgrade:!reason,
  attributes:definition?(require('./equipment-base-config')[id]?.lines||[]):entry.attributes,
  effects:definition?[definition.description]:entry.effects,
  upgrades:steps,diamonds:meta.diamonds||0,qualityStyle:config.quality[entry.quality]};
}
/** 分组顺序保持通用、物理、法术；来源表中的隐藏特殊物品不在本图鉴中。 */
function groups(state){return config.categories.map(([id,name])=>({id,name,items:entries.filter(e=>e.category===id).map(e=>query(e.id,state))}));}
module.exports={query,groups};
