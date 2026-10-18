"use strict";
const policy=require('./expedition-config').experience;
/** 现有等级沿用原经验表，后续等级按配置增量继续成长。 */
function cost(level){return policy.thresholds[level-1]??policy.thresholds[policy.thresholds.length-1]+(level-policy.thresholds.length)*policy.growth;}
/** 结算时逐级消耗经验，支持连续升级。 */
function advance(state){while(state.experience>=cost(state.level)){state.experience-=cost(state.level);state.level++;}}
/** 第一节使用独立经验节奏，其余节沿章节增长；VIP和天赋在调用方独立结算。 */
function reward(chapter,type,section){const opening=policy.openingSection;if(chapter>=opening.fromChapter&&section===opening.section)return Math.round((type==='elite'?policy.elite:policy.normal)*opening.multiplier);const c=policy.chapterGrowth,multiplier=1+Math.max(0,(chapter||1)-c.startChapter)*c.perChapter;return Math.round((type==='elite'?policy.elite:policy.normal)*multiplier);}
module.exports={cost,advance,reward};
