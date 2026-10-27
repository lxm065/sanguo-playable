'use strict';
const c=require('./mechanism-blast-config'),view=require('./mechanism-volley-view');
/** 机弩轰击只召一架实体弩；同次多重施法共享弩身，发射次数仍由真实事件驱动。 */
function ability(v,a,target,e){if(a.unit?.heroId!==c.hero||e.skillId!==c.skillId)return false;if(!a.node?.isValid||!target?.node?.isValid)return true;const cast='native-'+e.skillId+'-'+e.t,key=e.uid+':'+cast,travel=e.impactDelay||c.travelFallback;
 if(!v.mechanismVolleys?.has(key))view.cast(v,{...e,cast,phase:'deploy',duration:travel+c.hold},c.visual);
 view.cast(v,{...e,cast,phase:'fire',bow:0,duration:travel},c.visual);return true;}
/** 原伤害命中时复用弩箭冲击光，不在施法阶段提前播放命中。 */
function hit(v,source,target,e){if(source?.unit?.heroId!==c.hero||e.effect!==c.effect)return false;if(target?.node?.isValid)view.hit(v,target);return true;}
module.exports={ability,hit};
