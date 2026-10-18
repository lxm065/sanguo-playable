'use strict';
const c=require('./final-boss-config');
/** 第一阶段固定教学首领不参与后续阶段适配。 */
function active(state){return state.meta?.section>=c.fromSection&&require('./route-graph').nodes(state.meta,require('./classic-config')).find(n=>n.id===state.meta.activeNode)?.type===c.type;}
/** 全部持有武将决定最高阶和名额；场下高级武将仍计入，数量受人口限制。 */
function plan(state,count){const reference=require('./strongest-team').query(state,require('./config')),team=reference.units,star=Math.min(c.maxStar,reference.highest),promoted=Math.min(count,reference.highestCount+c.highestExtra);return {star,baseStar:Math.max(1,star-1),promoted,team,population:reference.population};}
/** 核心最高阶外的副将沿用较低阶分布，额外副将取最低阶，不再全员紧贴最高阶。 */
function range(state,result){if(!active(state))return result;const p=plan(state,result.count),count=Math.min(result.count,p.star===1?p.promoted:p.population+c.countLead),promoted=Math.min(count,p.promoted),lower=p.team.map(u=>Math.min(p.baseStar,u.star)).sort((a,b)=>a-b),levels=Array.from({length:count},(_,i)=>i<promoted?p.star:lower[(i-promoted)%Math.max(1,lower.length)]||1);return {...result,count,minCount:count,maxCount:count,minStar:Math.min(...levels),maxStar:p.star,star:p.baseStar,promoted,levels};}
/** 最终生成与旧缓存迁移共用配装限额；一级队伍的援军也计入最高阶人数上限。 */
function equip(state,units){if(!active(state))return units;const p=plan(state,units.length),result=p.star===1?units.slice(0,p.promoted):units,quota=Math.ceil(result.filter(u=>!u.reinforcement).length*require('./enemy-equipment-coverage').coverage(state,'boss'));let equipped=0;return result.map(u=>({...u,equipment:!u.reinforcement&&equipped++<quota?(u.equipment||[]).slice(0,c.itemsPerUnit):[]}));}
/** 兼容独立生成入口，套用同一等级与装备策略。 */
function apply(state,units){if(!active(state)||!units.length)return units;const r=range(state,{count:units.length});return equip(state,units.slice(0,r.count).map((u,i)=>({...u,star:r.levels[i]})));}
module.exports={active,plan,range,apply,equip};
