'use strict';
const c=require('./enemy-opening-config');
/** 优先使用实际已通关敌军总等级；旧档缺记录时按已完成战斗数保守递进。 */
function budget(state){const previous=state.expedition?.openingProgress;if(previous?.chapter===state.meta?.chapter&&Number.isFinite(previous.total))return previous.total+c.progression.maxIncrease;const completed=Math.max(0,require('./enemy-opening').index(state));return c.progression.initialTotal+completed*c.progression.maxIncrease;}
/** 正式通关领奖才记录实际锁定敌阵；失败、练习、事件和重复结算不推进。 */
function settle(model,pending){const state=model.state;if(pending.training||pending.battle.result!=='win'||!require('./enemy-opening').active(state))return;const encounter=state.expedition?.enemyEncounter;if(!encounter||encounter.key!==require('./enemy-budget').key(state))return;const node=state.meta.activeNode,previous=state.expedition.openingProgress;if(previous?.chapter===state.meta.chapter&&previous.node===node)return;const total=encounter.units.reduce((n,u)=>n+u.star,0);state.expedition.openingProgress={chapter:state.meta.chapter,node,total};}
module.exports={budget,settle};
