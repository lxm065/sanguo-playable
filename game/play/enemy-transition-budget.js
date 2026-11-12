'use strict';
/** 约束普通换精英或首领时的总目标跳幅；视频恢复及重玩沿用原规则。 */
function query(state,type,difficulty){
 const config=require('./enemy-win-growth-config').transition,cycle=require('./enemy-difficulty-cycle').current(state),requested=type*difficulty;
 if(!config.enabled||!cycle||!(cycle.lastClearedCurve>0)||state.meta.chapter<=state.meta.cleared||Number.isFinite(cycle.recoveryTarget)&&difficulty<cycle.recoveryTarget-require('./enemy-win-growth-config').epsilon)return {difficulty,curve:requested};
 const rate=(config.chapterPolicies||[]).filter(p=>state.meta.chapter>=p.fromChapter).at(-1)?.maxIncrease??config.maxIncrease,limit=cycle.lastClearedCurve*(1+rate),curve=Math.min(requested,limit);
 return {difficulty:curve/type,curve,transition:{requested,limit,capped:requested>limit}};
}
module.exports={query};
