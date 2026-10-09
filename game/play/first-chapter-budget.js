'use strict';
const c=require('./first-chapter-budget-config');
/** 教学节之后仅首章启用总等级预算。 */
function active(state){return state.meta?.chapter===c.chapter&&state.meta.section>=c.fromSection;}
/** 有上阵武将时按实际出战阵容计算；空阵时以人口内最强候选预览。 */
function team(state,rules){const deployed=state.units.filter(u=>u.slot>=0);return deployed.length?deployed:state.units.slice().sort((a,b)=>b.star-a.star).slice(0,require('./population').limit(state,rules));}
/** 固定关卡的人数偏移，重试不会重新抽取人数。 */
function budget(state,rules){const allies=team(state,rules),select=require('./enemy-stage').select,lead=select(state,Math.min(...c.countLeads),Math.max(...c.countLeads)),available=Math.min(require('./population').limit(state,rules),state.units.length),count=Math.min(rules.columns*rules.rows,rules.maxDeployedLimit,Math.max(available+require('./enemy-count-config').offsets.battle,allies.length+lead));return {count:Math.max(1,count),levels:Math.max(count,allies.reduce((sum,u)=>sum+u.star,0)+select(state,...c.levelLeads))};}
/** 普通、精英、首领及旧缓存共用预算，先保留首领身份再均匀分配等级。 */
function apply(units,state,rules,roster){if(!active(state)||state.pending||!units.length)return units;const b=budget(state,rules),result=Array.from({length:b.count},(_,i)=>{const u=units[i%units.length];return {...u,uid:-i-1,star:1,equipment:state.meta.section<c.equipmentFromSection?[]:(u.equipment||[]).map((e,j)=>({...e,uid:'enemy:'+(-i-1)+':'+j,owner:-i-1}))};});let left=Math.min(b.levels,result.length*c.maxStar)-result.length;for(let i=0;left>0;i=(i+1)%result.length){if(result[i].star<c.maxStar){result[i].star++;left--;}}return require('./enemy-formation').arrange(result,roster,rules);}
module.exports={active,team,budget,apply};
