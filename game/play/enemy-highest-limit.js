'use strict';
const c=require('./enemy-stage-config');
/** 按章节与真实节点类型读取最高阶额外名额，首领和后续章节沿用默认值。 */
function extra(state){
 const node=require('./route-graph').nodes(state.meta,require('./classic-config')).find(n=>n.id===state.meta.activeNode);
 const policy=c.highestLimit.chapterPolicies.find(p=>state.meta.chapter>=p.fromChapter&&state.meta.chapter<=p.toChapter&&p.types.includes(node?.type));
 return policy?.extra??c.highestLimit.extra;
}
/** 最终主力和援军共用最高阶限额；场下持有武将计入，纯一级队伍超额则减员。 */
function apply(units,state,rules){
 if(state.pending||state.meta?.section<c.currentTeam.fromSection)return units;
 const reference=require('./strongest-team').query(state,rules),highest=Math.min(c.currentTeam.maxStar,reference.highest),quota=reference.highestCount+extra(state);
 let used=0;
 return units.flatMap(unit=>{
  let star=Math.min(unit.star,highest);
  if(star===highest&&used++>=quota){if(highest<=c.currentTeam.minStar)return [];star=highest-1;}
  return [{...unit,star}];
 });
}
/** 生成计划与最终敌阵使用同一限额，避免面板人数和实际生成结果不一致。 */
function range(result,state,rules){
 const levels=apply((result.levels||Array.from({length:result.count},(_,i)=>result.star+(i<result.promoted?1:0))).map(star=>({star})),state,rules).map(u=>u.star);
 return {...result,levels,count:levels.length,minCount:Math.min(result.minCount,levels.length),maxCount:Math.min(result.maxCount,levels.length),minStar:Math.min(...levels),maxStar:Math.max(...levels)};
}
module.exports={apply,range};
