'use strict';
const c=require('./enemy-pressure-config');
/** 沿用阵容人数与等级，削减多人主力叠加章节倍率造成的属性压力。 */
function factor(state,rules,type){
 if(state.meta?.section<c.fromSection||c.types[type]===undefined)return 1;
 const own=require('./first-chapter-budget').team(state,rules).length;
 const main=require('./enemy-stage').range(state,rules).count;
 const ratio=Math.max(c.minCountRatio,Math.min(1,own/Math.max(1,main)));
 return c.types[type]*Math.pow(ratio,c.countExponent);
}
module.exports={factor};
