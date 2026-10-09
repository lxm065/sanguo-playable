'use strict';
const c=require('./tutorial-enemy-config');
/** 只对首章第一节启用入门保护。 */
function active(state){return state.meta?.chapter===c.chapter&&state.meta?.section===c.section;}
/** 首个普通战斗由路线进度判断，不因失败或重复进入而变化。 */
function first(state){const m=state.meta;return m?.chapter>=c.first.fromChapter&&m?.section===c.section&&require('./enemy-opening').index(state)===0&&require('./route-graph').nodes(m,require('./classic-config')).some(n=>n.id===m.activeNode&&n.row===c.first.row);}
/** 统一处理新生成和旧档缓存敌阵，保留未结算战报原样。 */
function apply(units,state){if(state.pending)return units;const opening=first(state);if(!opening&&!active(state))return units;return units.slice(0,opening?c.first.count:c.maxCount).map(u=>({...u,star:opening?c.first.star:Math.min(u.star,c.maxStar),equipment:(opening?c.first.equipment:c.equipment)?u.equipment:[]}));}
module.exports={active,first,apply};
