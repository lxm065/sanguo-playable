'use strict';
const c=require('./enemy-light-balance-config');
/** 只读取当前章本局的基准；章节重开创建新的远征状态，自然清除基准。 */
function current(state){const value=state.expedition?.difficultyCycle;return state.meta?.section>=c.fromSection&&value?.chapter===state.meta.chapter?value:null;}
/** 章节策略统一提供恢复次数，避免新回调与旧档迁移使用不同规则。 */
function recoveryWins(value){return require('./enemy-cycle-policy').forChapter(value.chapter).recoveryWins;}
/** 恢复目标未到达时才保留小步幅，历史视频次数不会永久压低正常增长。 */
function recovering(value){return Number.isFinite(value.recoveryTarget)&&value.difficulty<value.recoveryTarget-require('./enemy-win-growth-config').epsilon;}
/** 旧档未完成恢复保留步幅；已经完成或没有目标时恢复基础增幅。 */
function increment(value){return Math.max(c.minWinIncrement,recovering(value)?(value.growthStep??(value.recoveryTarget-value.difficulty)/recoveryWins(value)):c.winIncrement);}
/** 旧恢复周期按已完成胜场迁移剩余次数，只调整步幅，不改变当前难度和目标。 */
function migrateRecovery(value){if(!recovering(value)||!Number.isFinite(value.recoveryStart)||!(value.growthStep>0)||value.recoverySteps===recoveryWins(value))return;const completed=Math.max(0,Math.round((value.difficulty-value.recoveryStart)/value.growthStep)),remaining=Math.max(1,recoveryWins(value)-completed);value.growthStep=Math.max(c.minWinIncrement,(value.recoveryTarget-value.difficulty)/remaining);value.recoverySteps=recoveryWins(value);}
/** 首次实际开战才记录战力，地图预览及后续升级均不重新取样。 */
function initialize(state,power){if(current(state)){const value=current(state);migrateRecovery(value);value.difficulty=Math.max(c.minDifficulty,value.difficulty);value.growthStep=increment(value);return value;}if(!state.meta||state.meta.section<c.fromSection)return null;return state.expedition.difficultyCycle={chapter:state.meta.chapter,baseline:power,difficulty:c.initialDifficulty,growthStep:c.winIncrement,wins:0,videoReliefs:0,consecutiveWins:0};}
/** 只有正式胜利领奖增加系数；跨阶段保留，失败和练习均不增长。 */
function settle(model,pending){const value=current(model.state);if(!value||pending.training)return;if(pending.battle.result!=='win'){if(value.easyStreak)value.easyStreak=0;if(value.consecutiveWins)value.consecutiveWins=0;return;}const node=model.progression.nodes().find(n=>n.id===model.state.meta.activeNode);if(c.types[node?.type]===undefined)return;const encounter=model.state.expedition.enemyEncounter,cleared=encounter?.key===require('./enemy-budget').key(model.state)?encounter.lightBalance?.difficulty:undefined;value.lastClearedDifficulty=Math.max(c.minDifficulty,cleared??value.difficulty);
 if(recovering(value)){migrateRecovery(value);const step=increment(value);value.difficulty=Math.min(c.maxDifficulty,value.recoveryTarget,value.lastClearedDifficulty+step);value.easyStreak=0;value.consecutiveWins=0;value.lastGrowth={kind:'recovery',step};if(!recovering(value)){value.difficulty=Math.min(c.maxDifficulty,value.recoveryTarget);value.growthStep=c.winIncrement;}}
 else{const growth=require('./enemy-win-growth').plan(value,pending.battle,model.rules,c.winIncrement);value.difficulty=Math.min(c.maxDifficulty,value.lastClearedDifficulty+growth.step);value.growthStep=c.winIncrement;value.easyStreak=growth.streak;value.consecutiveWins=growth.consecutiveWins;value.lastGrowth=growth;}
 value.wins++;}
/** 按不含关卡系数的通关锚点回退实际目标；除去本关系数后存储，失败目标仍保持原口径用于恢复。 */
function relieve(state,type=1){const value=current(state);if(!value)return null;const anchor=value.lastClearedDifficulty??value.legacyAnchor??Math.max(c.initialDifficulty,value.difficulty-increment(value)*c.unknownHistoryRollbackSteps);if(value.lastClearedDifficulty===undefined)value.legacyAnchor=anchor;const curve=value.difficulty*type,candidate=Math.min(curve,anchor),multiplier=require('./enemy-cycle-policy').forChapter(value.chapter).retryFallbackMultiplier,start=Math.max(c.minDifficulty,(candidate<curve-require('./enemy-win-growth-config').epsilon?candidate:curve*multiplier)/type),gap=value.difficulty-start;value.recoveryStart=start;value.recoveryTarget=Math.max(value.recoveryTarget??0,gap>0?value.difficulty:start+increment(value));value.growthStep=Math.max(c.minWinIncrement,(value.recoveryTarget-start)/recoveryWins(value));value.recoverySteps=recoveryWins(value);value.difficulty=start;value.easyStreak=0;value.consecutiveWins=0;value.videoReliefs++;return value;}
module.exports={current,initialize,settle,relieve,increment};
