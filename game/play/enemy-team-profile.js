'use strict';
const c=require('./enemy-stage-config');
/** 核心阵容保留等级分布，额外主力使用队伍最低阶；缩编以最大余数法分配。 */
function levels(state,rules,count,promoted){
 const reference=require('./strongest-team').query(state,rules),team=reference.units,groups=new Map();
 for(const u of team){const star=Math.max(c.currentTeam.minStar,Math.min(c.currentTeam.maxStar,u.star));groups.set(star,(groups.get(star)||0)+1);}
 if(!team.length)return Array(count).fill(c.currentTeam.minStar);
 const coreCount=Math.min(count,team.length);const shares=[...groups].map(([star,n])=>{const exact=n*coreCount/team.length;return {star,count:Math.floor(exact),remainder:exact%1};}).sort((a,b)=>b.remainder-a.remainder||b.star-a.star);
 const left=coreCount-shares.reduce((sum,s)=>sum+s.count,0);for(let i=0;i<left;i++)shares[i].count++;
 const ordered=team.map(u=>Math.max(c.currentTeam.minStar,Math.min(c.currentTeam.maxStar,u.star))).sort((a,b)=>a-b),extraStar=ordered[Math.floor((ordered.length-1)*Math.max(0,Math.min(1,c.extraMainQuantile)))];const result=shares.flatMap(s=>Array(s.count).fill(s.star)).concat(Array(count-coreCount).fill(extraStar)).sort((a,b)=>a-b);
 // 沿用关卡升一级名额，先提升低阶单位，每名最多提升一级。
 for(let i=0,used=0;i<result.length&&used<promoted;i++)if(result[i]<Math.min(c.currentTeam.maxStar,reference.highest)){result[i]++;used++;}
 return result.sort((a,b)=>b-a);
}
/** 共用面板的生命与普攻秒伤折算静态强度；不把控制技能近似成伤害。 */
function strength(stats){return Math.sqrt(Math.max(1,stats.hp)*Math.max(1,stats.attack)/Math.max(c.power.minInterval,stats.interval));}
/** 穿戴装备的实际增益做有限补偿；基准含同一天赋羁绊，避免重复计算永久培养。 */
function equipment(state,rules){
 const reference=require('./strongest-team').query(state,rules),team=reference.units,roster=require('./expedition-roster'),stats=require('./expedition-stats').stats,meta=state.meta||{};
 const equipment=reference.equipment,context={...rules,playerEquipmentGrades:meta.equipmentGrades,playerTalentTree:meta.activities?.talent?.tree?.levels||{},playerBonds:meta.activatedBonds||[]};
 let base=0,actual=0;for(const unit of team){if(!roster.some(h=>h.id===unit.heroId))continue;base+=strength(stats(unit,team,roster,[],context));actual+=strength(stats(unit,team,roster,equipment,context));}
 const ratio=base?actual/base:1;return {base,actual,ratio,factor:Math.min(c.power.maxFactor,1+Math.max(0,ratio-1)*c.power.equipmentWeight)};
}
module.exports={levels,equipment};
