'use strict';
const c=require('./enemy-stage-config');
/** 人口内最强合法阵容决定新遭遇基准，不受实际部署与装备归属影响。 */
function query(state,rules){const reference=require('./strongest-team').query(state,rules),units=reference.units,average=units.reduce((n,u)=>n+u.star,0)/Math.max(1,units.length);return {count:units.length,average,star:Math.max(c.currentTeam.minStar,Math.min(c.currentTeam.maxStar,Math.floor(average))),equipment:reference.equipment.length};}
module.exports={query};
