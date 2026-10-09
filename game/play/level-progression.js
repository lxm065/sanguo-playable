"use strict";
const policy=require('./expedition-config').experience;
/** 现有等级沿用原经验表，后续等级按配置增量继续成长。 */
function cost(level){return policy.thresholds[level-1]??policy.thresholds[policy.thresholds.length-1]+(level-policy.thresholds.length)*policy.growth;}
/** 结算时逐级消耗经验，支持连续升级。 */
function advance(state){while(state.experience>=cost(state.level)){state.experience-=cost(state.level);state.level++;}}
/** 胜利节点经验随所在章节增长；VIP和天赋经验在调用方继续独立结算。 */
function reward(chapter,type){const c=policy.chapterGrowth,multiplier=1+Math.max(0,(chapter||1)-c.startChapter)*c.perChapter;return Math.round((type==='elite'?policy.elite:policy.normal)*multiplier);}
module.exports={cost,advance,reward};
