'use strict';
const c=require('./enemy-equipment-config');
/** 后期章节第二阶段起提高主力配装覆盖；第一阶段保护、低级援军不参与。 */
function bonus(state){const p=c.laterCoverage;return state.meta?.chapter>=p.fromChapter&&state.meta?.section>=p.fromSection?p.bonus:0;}
/** 普通、精英和首领各自的原覆盖率上增加同一配置增量。 */
function coverage(state,type){const base=type==='boss'?require('./final-boss-config').equipmentCoverage:(c.coverage[type]??c.coverage.battle);return Math.min(1,base+bonus(state));}
/** 最终阵容成型后补足可见装备，避免参考章映射或扩编把覆盖率稀释。 */
function apply(units,state,roster){if(!bonus(state)||state.pending)return units;const type=require('./route-graph').nodes(state.meta,require('./classic-config')).find(n=>n.id===state.meta.activeNode)?.type||'battle',main=units.filter(u=>!u.reinforcement),quota=Math.ceil(main.length*coverage(state,type));let index=0;
 return units.map(u=>{if(u.reinforcement)return u;const targeted=index++<quota;if(!targeted||u.equipment?.length)return u;return require('./enemy-equipment').equip([u],{...state,stage:(state.stage||1)+Math.abs(u.uid)},roster,type)[0];});}
module.exports={bonus,coverage,apply};
