'use strict';
const policy=require('./interaction-performance-config');
/** 记录一组直属节点；重画小区域时沿用原层级，不盖住棋子或弹窗。 */
function region(v,name,draw){
 const regions=v.battleRegions||(v.battleRegions=new Map()),old=regions.get(name)||[];
 const index=old.find(n=>n.isValid&&n.parent===v.root)?.getSiblingIndex();
 for(const n of old)remove(n);
 const before=new Set(v.root.children);draw();
 const nodes=v.root.children.filter(n=>!before.has(n));regions.set(name,nodes);
 if(index!==undefined)nodes.forEach((n,i)=>n.setSiblingIndex(index+i));
}
/** Cocos 延迟销毁之前立即脱离父节点，防止当帧重复命中和节点查找。 */
function remove(node){if(node?.isValid){node.removeFromParent();node.destroy();}}
/** 站位仅移动既有演员；外观、显示倍率和其余属性变化才需要重新装配。 */
function friendlyKey(unit,x,y,scale){const {slot,...appearance}=unit;return JSON.stringify([appearance,scale]);}
/** 仅捕获界面相关的小快照，不复制包含事件时间轴的战报。 */
function inputs(v){const s=v.model.state,e=s.expedition,m=s.meta;return {
 scene:JSON.stringify([m.chapter,m.section,m.lord,e.tutorialRunId]),
 units:JSON.stringify(s.units),unitRefs:s.units.slice(),equipment:JSON.stringify([e.equipment,m.equipmentGrades]),
 bonds:JSON.stringify([s.units.map(u=>[u.uid,u.heroId,u.star,u.slot]),require('./bond-activation').state(v.model),v.model.maxRank()]),
 novice:JSON.stringify([require('./novice-rewards').current(v.model),!!s.pending,e.adSerial]),
 enemy:JSON.stringify([s.stage,s.wins,s.units,e,m]),pending:s.pending,
};}
/** 页面必须确实对应动作前的版本，跨页、回放及事件场景仍用完整重建。 */
function begin(v){const stamp=v.renderedActionState;
 if(!policy.partialBattleRefresh||v.page!=='battle'||v.playing||v.startingBattle||!v.formationAnchor?.isValid||!v.battleRegions||require('./node-event-view').active(v)||stamp?.model!==v.model||stamp.state!==v.model.state||stamp.revision!==(v.model.revision||0))return null;
 return {model:v.model,state:v.model.state,anchor:v.formationAnchor,...inputs(v)};
}
/** 释放已经消费的合成或奖励弹窗，不触发旧的关闭重绘回调。 */
function closeModal(v){remove(v.modal);v.modal=null;}
/** 对照实际显示的演员，仅替换发生变化的棋子；战后姿态切回可布阵状态。 */
function formation(v,before,after){
 const pending=v.model.state.pending;
 // 同一份待领取战报刷新候选时，全部战后演员保持原样。
 if(pending&&pending===before.pending)return;
 const enemies=require('./enemy-board-view').preview(v.model.state)?(before.enemy===after.enemy&&v.battlePreviewEnemies?v.battlePreviewEnemies:v.model.enemies()):[];
 v.battlePreviewEnemies=enemies;
 const desired=[...enemies.map(unit=>({unit,enemy:true})),...v.model.state.units.filter(u=>u.slot>=0).sort((a,b)=>b.slot-a.slot).map(unit=>({unit,enemy:false}))];
 const ids=new Set(desired.map(x=>x.unit.uid)),reserve=new Set(v.reserveScope?.actors.keys()||[]);
 for(const [id,a]of v.actors)if(!reserve.has(id)&&!ids.has(id)){remove(a.node);v.actors.delete(id);}
 let index=v.formationAnchor.getSiblingIndex()+1;
 for(const {unit,enemy}of desired){
  const p=v.position(unit.slot%v.config.columns,Math.floor(unit.slot/v.config.columns)+(enemy?v.config.rows:0));
  const key=friendlyKey(unit,p.x,p.y,v.config.layout.modelScale),old=v.actors.get(unit.uid);
  let actor=old;
  if(!old?.node.isValid||old.preparationKey!==key||(!enemy&&old.unit!==unit)){
   if(old){remove(old.node);v.actors.delete(unit.uid);}
   if(enemy){actor=v.ui.actor(v.root,{...unit,side:'enemy'},p.x,p.y,v.config.layout.modelScale);actor.preparationKey=key;v.actors.set(unit.uid,actor);v.bindAttributeTap(actor,unit);}
   else actor=v.drawFriendly(unit,p.x,p.y,v.config.layout.modelScale);
   v.battleHud.renderEquipped(unit);
  }
  // 拖回同一格也需要恢复坐标和层级，但不必销毁节点。
  actor.node.setPosition(p.x,p.y);if(!enemy)actor.preparationOrigin={x:p.x,y:p.y};actor.node.setSiblingIndex(index++);
 }
}
/** 成功事务按区域同步，保存写入与奖励算法仍由原领域事务负责。 */
function apply(v,before){
 if(!before||v.model!==before.model||v.model.state!==before.state||v.page!=='battle'||v.playing||v.startingBattle||v.formationAnchor!==before.anchor||!before.anchor.isValid||require('./node-event-view').active(v))return false;
 const after=inputs(v);
 if(before.scene!==after.scene||(!before.pending&&after.pending)||(after.pending&&after.pending!==before.pending))return false;
 closeModal(v);require('./lord-skill-view').cancel(v);require('./deployment-view').clear(v);
 const changedUnits=before.units!==after.units||before.unitRefs.some((unit,i)=>unit!==after.unitRefs[i]),changedEquipment=before.equipment!==after.equipment,settled=!!before.pending&&!after.pending;
 formation(v,before,after);
 if(changedUnits||settled)v.renderReserve(true,true);
 require('./expedition-header').update(v);
 if(before.novice!==after.novice)region(v,'novice',()=>v.renderNovice());
 if(before.bonds!==after.bonds||settled){v.battleHud.renderBonds();require('./merge-hints').show(v);}
 if(changedEquipment){v.battleHud.renderEquipment();for(const unit of v.model.state.units)v.battleHud.renderEquipped(unit);}
 if(changedUnits||changedEquipment)require('./team-equipment-buffs').render(v);
 v.updateBattleControls();
 require('./notification-view').refresh(v);
 // 教学节点有自己的循环动画，重建该区域前显式释放。
 require('./tutorial-view').cancel(v);remove(v.root.getChildByName('new-player-guide'));remove(v.root.getChildByName('equipment-tutorial'));
 v.showBattleOverlays();
 if(v.page==='battle'&&!v.model.state.pending)require('./battle-panel-warm').schedule(v,v.battlePreviewEnemies||[]);
 v.preparationRendered=v.page==='battle'&&!v.model.state.pending;
 require('./render-cadence').apply(v);require('./cloud-save-ui').indicator(v);require('./action-feedback').rendered(v);
 return true;
}
module.exports={region,remove,friendlyKey,begin,apply,closeModal};
