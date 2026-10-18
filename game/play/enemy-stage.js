'use strict';
const c=require('./enemy-stage-config');
/** 阶段取值位置不依赖随机数与胜场，重绘不会重新抽取。 */
function position(state){return c.positions[state.meta?.section]??0;}
/** 按配置区间取整，第一阶段精确下限、第五阶段精确上限。 */
function select(state,min,max){return Math.round(min+(Math.max(min,max)-min)*position(state));}
/** 保留人口下限，在小节基础上按路线进度与关卡类型增加人数及高阶名额。 */
function range(state,rules){
 if(require('./enemy-opening').active(state))return require('./enemy-opening').plan(state,rules);
 const chapter=require('./chapter-difficulty-config').chapters[state.meta?.chapter]||require('./chapter-difficulty-config').chapters[c.referenceChapter],section=chapter.sections[state.meta?.section]||chapter.sections[c.openingSection];
 const nodes=require('./route-graph').nodes(state.meta,require('./classic-config')),node=nodes.find(n=>n.id===state.meta.activeNode),offsets=require('./enemy-count-config').offsets;
 const available=state.meta.section>=c.currentTeam.fromSection?require('./population').limit(state,rules):Math.min(require('./population').limit(state,rules),state.units.length),cap=Math.min(rules.columns*rules.rows,rules.maxDeployedLimit,require('./tutorial-enemy').active(state)?require('./tutorial-enemy-config').maxCount:Infinity);
 const floor=available+(offsets[node?.type]??offsets.battle),minCount=Math.min(cap,Math.max(section.startCount,floor)),maxCount=Math.min(cap,Math.max(section.endCount,minCount)),minStar=state.meta.section===c.openingSection?c.openingStar:require('./enemy-level-config').minimumBySection[state.meta.section],maxStar=Math.max(minStar,section.maxStar);
 const dynamic=state.meta.section>=c.currentTeam.fromSection?require('./enemy-current-team').query(state,rules).star:null;const result={minCount,maxCount,minStar:dynamic??minStar,maxStar:dynamic??maxStar,count:select(state,minCount,maxCount),star:dynamic??select(state,minStar,maxStar),promoted:0};
 const p=c.progression;if(state.meta.chapter<p.fromChapter||state.meta.section<p.fromSection)return require('./final-boss').range(state,result);
 const progress=Math.max(0,Math.min(1,(node?.row??state.meta.layer??0)/Math.max(1,...nodes.map(n=>n.row)))),type=p.types[node?.type]||p.types.battle;
 result.maxCount=Math.min(cap,Math.max(maxCount,minCount+p.countGrowth)+type.extraCount);
 result.count=Math.min(cap,minCount+Math.floor((Math.max(maxCount,minCount+p.countGrowth)-minCount)*progress)+type.extraCount);
 result.maxStar=Math.min(require('./strongest-team').query(state,rules).highest,result.star+1);
 const promotion=Math.max(0,(progress-p.promotionStart)/(1-p.promotionStart))*p.promotionFraction+type.promotion;
 result.promoted=result.star<result.maxStar?Math.min(result.count,Math.floor(result.count*promotion)):0;
 if(!require('./final-boss').active(state)){result.levels=require('./enemy-team-profile').levels(state,rules,result.count,result.promoted);result.minStar=Math.min(...result.levels);result.maxStar=Math.max(...result.levels);}
 return require('./enemy-highest-limit').range(require('./final-boss').range(state,{...result,progress}),state,rules);
}
/** 在所有普通、精英、首领生成路径的末端统一裁定，已锁定新版敌阵和待领战报保持原样。 */
function apply(units,state,rules,roster,cached=false){if(state.pending||!units.length)return units;if(require('./enemy-stage-two-opening').active(state))units=require('./enemy-stage-two-opening').strip(units,state);if(require('./tutorial-enemy').first(state))return require('./tutorial-enemy').apply(units,state);if(require('./enemy-opening').active(state)){if(cached&&state.expedition?.enemyEncounter?.stagePolicyVersion===c.version&&!require('./enemy-opening').stale(state,state.expedition?.enemyEncounter))return units;return require('./enemy-opening').protect(units,state,roster,rules);}if(cached&&state.expedition?.enemyEncounter?.stagePolicyVersion===c.version)return units;if(cached&&state.expedition?.enemyEncounter?.stagePolicyVersion>=c.highestLimit.migrateFromVersion)return require('./enemy-highest-limit').apply(units,state,rules);if(require('./opening-boss').active(state))return require('./opening-boss').apply(units,state,rules,roster);const target=range(state,rules),guards=units.length>1?units.slice(1):units;const levels=target.levels;const result=Array.from({length:target.count},(_,i)=>{const u=units[i]||guards[(i-units.length)%guards.length],uid=-i-1;return {...u,uid,star:levels?.[i]??(target.star+(i<target.promoted?1:0)),equipment:(u.equipment||[]).map((item,j)=>({...item,uid:'enemy:'+uid+':'+j,owner:uid}))};});return require('./enemy-highest-limit').apply(require('./enemy-stage-two-opening').strip(require('./final-boss').equip(state,require('./enemy-equipment-coverage').apply(require('./enemy-reinforcements').apply(require('./enemy-formation').arrange(require('./enemy-opening').protect(result,state,roster),roster,rules),state,rules,roster),state,roster)),state),state,rules);}
module.exports={position,select,range,apply};
