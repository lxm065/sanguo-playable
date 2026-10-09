'use strict';
const c=require('./tutorial-config');
/** 复用部署指示手，从真实装备位置拖向推荐武将；动画不拦截操作。 */
function show(v){const target=require('./equipment-tutorial').target(v);if(!target)return false;const u=v.ui,cc=v.cc,p=c.equipment,root=u.node(v.root,'equipment-tutorial'),actor=v.actors.get(target.unit.uid),from=target.from.position,to=actor.node.position;
 const panel=u.box(root,'equipment-guide-dialogue',0,p.dialogueY,p.width,p.height,p.background);u.text(panel,p.text,0,0,p.font,p.color,p.width-30,p.height-10);
 const h=require('./tutorial-view').hand(v,root,from.x,from.y+c.handOffset);v.guideTargets=v.guideTargets||[];v.guideTargets.push(h);cc.tween(h).repeatForever(cc.tween().to(c.dragSeconds,{position:new cc.Vec3(to.x,to.y+c.handOffset,0)}).delay(p.pause).set({position:new cc.Vec3(from.x,from.y+c.handOffset,0)}).delay(p.pause)).start();
 if(!v.model.state.meta.equipmentTutorial.voiced){v.model.transact(()=>{v.model.state.meta.equipmentTutorial.voiced=true;});require('./tutorial-voice').play(v,'equipment');}return true;}
/** 局部刷新穿戴后移除已完成的指示，不刷新整幅棋盘。 */
function clear(v){const n=v.root?.getChildByName('equipment-tutorial');if(!n)return;require('./tutorial-view').cancel(v);n.removeFromParent();n.destroy();require('./tutorial-voice').stop(v);}
module.exports={show,clear};
