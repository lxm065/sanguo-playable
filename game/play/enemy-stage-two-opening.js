'use strict';
const c=require('./enemy-light-balance-config').firstBattle;
/** 第二阶段第一个实际战斗为普通关时享受过渡；事件不计数，失败重试仍属本关。 */
function active(state){const m=state.meta;if(m?.section!==c.section)return false;const nodes=require('./route-graph').nodes(m,require('./classic-config')),node=nodes.find(n=>n.id===m.activeNode);if(node?.type!==c.type)return false;const cycle=state.expedition?.difficultyCycle;if(cycle?.chapter===m.chapter&&cycle.wins>0)return false;const done=m.route?.key===m.chapter+'-'+m.section?m.route.nodes:[];return !nodes.some(n=>done.includes(n.id)&&['battle','elite','boss'].includes(n.type));}
/** 在最终生成及旧缓存读取时清理首关装备，不改变人数、身份、等级与站位。 */
function strip(units,state){return !state.pending&&active(state)&&!c.equipment?units.map(u=>({...u,equipment:[]})):units;}
module.exports={active,strip};
