'use strict';
const c=require('./hero-combat-config');
/** 名册、图鉴和挑战共用逐级射程配置，避免面板与实际攻击距离分离。 */
function tier(id,t){const range=c.rangeByStar?.[id]?.[t.star]??c.rangeOverrides[id]??t.range;return {...t,range};}
module.exports={tier};
