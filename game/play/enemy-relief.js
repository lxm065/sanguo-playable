'use strict';
const config=require('./enemy-relief-config');
/** 仅当前章的正式远征读取援助；旧存档当前关的视频次数可直接兼容。 */
function snapshot(state){
 if(!state.meta||!state.expedition)return null;
 const saved=current(state);if(saved)return factors(saved.count,saved.remaining/saved.steps);
 const encounter=state.expedition.enemyEncounter;
 return encounter?.key===require('./enemy-budget').key(state)?factors(encounter.retries||0,1):null;
}
/** 从配置插值恢复战斗机制，不重复缩放生命、攻击和防御。 */
function factors(count,weight){if(!(count>0))return null;const tier=config.tiers[Math.min(count,config.tiers.length)-1],w=Math.max(0,Math.min(1,weight));return Object.fromEntries(Object.entries(tier).map(([key,value])=>[key,1+(value-1)*w]));}
/** 视频成功后持久化本关档位；跨关援助尚未恢复时不会因新视频变弱。 */
function grant(state){if(!state.meta||!state.expedition)return;const e=state.expedition.enemyEncounter,old=snapshot(state),steps=require('./enemy-cycle-policy').forChapter(state.meta.chapter).recoveryWins;let count=Math.max(1,e.retries||1);while(count<config.tiers.length&&old&&factors(count,1).healing>old.healing)count++;state.expedition.combatRelief={chapter:state.meta.chapter,count,steps,remaining:steps};}
/** 正式胜利逐步撤销援助，失败、预览、训练都不消耗恢复步数。 */
function win(state){const saved=current(state);if(saved){state.expedition.combatRelief={...saved,chapter:state.meta.chapter,remaining:Math.max(0,saved.remaining-1)};}}
/** 援助独立于第二阶段战力基准，兼容旧版周期内的援助存档。 */
function current(state){const e=state.expedition,saved=e?.combatRelief;if(saved?.chapter===state.meta?.chapter)return saved;return e?.difficultyCycle?.chapter===state.meta?.chapter?e.difficultyCycle.combatRelief:null;}
/** 所有阶段正式战斗胜利推进恢复，训练、失败和非战斗事件不消耗。 */
function settle(model,pending){if(pending.training||pending.battle.result!=='win')return;const node=model.progression.nodes().find(n=>n.id===model.state.meta.activeNode);if(require('./enemy-light-balance-config').types[node?.type]!==undefined)win(model.state);}
/** 控制时长只按敌方施加者缩短，玩家效果保持原样。 */
function duration(unit,seconds){return seconds*(unit.side==='enemy'?(unit.combatRelief?.control??1):1);}
/** 按稳定阵列顺序错开敌方重复开局钩人，所有首战和重试均适用。 */
function stagger(units){let index=0;for(const u of units){if(u.side!=='enemy')continue;const pulls=require('./hero-skills').entries(u).filter(s=>s.rule.pull&&s.rule.initialCooldown===0);if(!pulls.length)continue;const delay=Math.max(0,index++-config.openingPull.immediateCasters+1)*config.openingPull.spacingSeconds;for(const s of pulls)u.skillTimers[s.id]=Math.max(u.skillTimers[s.id],delay);}}
module.exports={snapshot,factors,grant,win,settle,duration,stagger};
