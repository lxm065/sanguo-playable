'use strict';
/** 刷新挑战装备栏与头顶图标，不重建棋盘、计时器或角色动画。 */
function refresh(v){const p=v.service.state.run.players[0],c=require('./challenge-config').ui,bar=v.root.getChildByName('challenge-equipment-bar');if(bar){for(const n of [...bar.children]){n.removeFromParent();n.destroy();}require('./challenge-equipment-bar').render(v,bar,p.equipment);}for(const unit of p.units){const actor=v.actors.get(unit.uid);if(!actor)continue;for(const n of [...actor.status.children])if(n.name==='challenge-equipped-icon'){n.removeFromParent();n.destroy();}p.equipment.filter(e=>e.owner===unit.uid).forEach((e,i)=>{v.ui.image(actor.status,'equipment/'+e.id+'.png',(i-1)*c.equippedIconGap,c.equippedIconY,c.equippedIconSize,c.equippedIconSize).name='challenge-equipped-icon';});}}
/** 挑战穿戴仍由自身服务校验阶段，只替换成功后的显示刷新方式。 */
function equip(v,uid,owner){const feedback=require('./action-feedback'),scope=feedback.begin(v.service.model,v);try{v.service.equip(uid,owner);refresh(v);feedback.rendered(v,v.service.model);}catch(e){if(feedback.canRetain(v.service.model,e,scope))v.dialog(require('./action-feedback-config').title,e.message);else feedback.challenge(v,e,scope);}}
module.exports={refresh,equip};
