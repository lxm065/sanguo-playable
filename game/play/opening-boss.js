'use strict';
const c=require('./opening-boss-config');
/** 首阶段首领查询保留兼容入口，统一使用首阶段保护规则。 */
function active(state){return state.meta?.section===c.section&&require('./route-graph').nodes(state.meta,require('./classic-config')).find(n=>n.id===state.meta.activeNode)?.type===c.type;}
/** 首领同样不超过玩家最强阵容的人数与等级，并且不携带装备。 */
function apply(units,state,rules,roster){return require('./enemy-opening').protect(units,state,roster,rules);}
module.exports={active,apply};
