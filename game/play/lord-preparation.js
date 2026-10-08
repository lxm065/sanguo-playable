'use strict';
/** 一次正式战斗尝试对应唯一回执；退回地图不刷新，结算后才能再次触发。 */
function key(model){const m=model.state.meta;return [m.chapter,m.section,m.activeNode,model.state.battles,m.lord].join(':');}
/** 仅对配置为进场触发的主公生效，非战斗事件、死亡与待结算状态均不触发。 */
function eligible(model){const s=model.state,m=s.meta,skill=require('./lord-skill-config').skills[m?.lord];return skill?.trigger==='preparation'&&!s.pending&&m.hp>0&&['battle','elite','boss'].includes(model.progression?.nodes().find(n=>n.id===m.activeNode)?.type);}
/** 装备在进场事务内落盘，加载与重复点击只读取已有结果。 */
function prepare(model){if(!eligible(model))return null;const id=key(model),old=model.state.expedition.lordPreparation;if(old?.key===id)return old;return model.transact(()=>{const receipt=require('./lord-skills').beforeFight(model);const record={key:id,receipt:{...receipt,phase:'preparation'},shown:false};model.state.expedition.lordPreparation=record;return record;});}
/** 开战沿用已经到账的进场技能；兼容直接调用开战的旧入口，不再发第二份。 */
function beforeFight(model,training){if(training)return null;if(require('./lord-skill-config').skills[model.state.meta?.lord]?.trigger==='preparation')return prepare(model)?.receipt;return require('./lord-skills').beforeFight(model,training);}
/** 动画只消费展示标记，奖励早已保存；动画结束即可把装备拖给武将。 */
function show(view){if(view.playing||view.startingBattle)return;const record=prepare(view.model);if(!record||record.shown)return;view.model.transact(()=>{view.model.state.expedition.lordPreparation.shown=true;});view.battleHud.renderEquipment();require('./lord-skill-view').show(view,()=>{},record.receipt);}
module.exports={key,eligible,prepare,beforeFight,show};
