"use strict";
const config=require('./enemy-equipment-config'),{random}=require('./combat');
/** 在生成完成的敌阵上确定性配装；不会写入玩家背包或消耗玩家随机种子。 */
function equip(units,state,roster,type='battle'){
 const meta=state.meta||{},chapter=meta.chapter||1,section=meta.section||1;
 if(chapter<config.start.chapter||(chapter===config.start.chapter&&section<config.start.section))return units;
 const rng=random((state.stage||1)*config.seedFactor+chapter*100+section),count=Math.ceil(units.length*(config.coverage[type]??config.coverage.battle));
 return units.map((u,i)=>{if(i>=count)return u;const h=roster.find(h=>h.id===u.heroId),kind=h.magic?'magic':h.range>1?'ranged':'melee',equipment=[];
  for(let n=0;n<(config.items[type]??config.items.battle);n++){const pool=config.pools[n?'secondary':kind];equipment.push({uid:'enemy:'+u.uid+':'+n,owner:u.uid,id:pool[Math.floor(rng()*pool.length)]});}
  return {...u,equipment};});
}
/** 敌方装备仅供同一侧属性准备使用，避免光环串到玩家阵营。 */
function collect(units){return units.flatMap(u=>u.equipment||[]);}
module.exports={equip,collect};
