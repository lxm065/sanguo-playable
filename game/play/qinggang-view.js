'use strict';
const c=require('./qinggang-config');
/** 使用战斗回放事件驱动高速位移与残影，速度跟随倍速，补间归现有清理流程管理。 */
function move(v,actor,event){
 if(event.effect!==c.effect)return false;
 const cc=v.cc,from=actor.node.position,to=v.position(event.x,event.y),target=v.actors.get(event.target);
 cc.Tween.stopAllByTarget(actor.node);
 v.ui.face(actor,to.x-from.x,to.y-from.y);
 require('./battle-effects').sprite(v,c.trailAsset,from.x,from.y+c.offsetY,c.trailSize,c.trailColor,{life:event.duration,flat:.3,grow:1,angle:Math.atan2(to.y-from.y,to.x-from.x)*180/Math.PI,travel:{x:to.x,y:to.y+c.offsetY}});
 v.ui.animate(actor,c.attackAnimation,false,{speed:v.speed,startProgress:c.attackStartProgress,duration:c.interval});
 cc.tween(actor.node).to(event.duration/v.speed,{position:new cc.Vec3(to.x,to.y,0)}).call(()=>{
  if(!actor.node.isValid||actor.alive===false)return;
  if(target?.node?.isValid)v.ui.face(actor,target.node.position.x-to.x,target.node.position.y-to.y);
  // 保留攻击至动作自然完成，位移完成不能提前切回待机。
 }).start();
 return true;
}
/** 每次真实命中绘制刀光；不依赖目标存活以保留最后一击的视觉反馈。 */
function hit(v,target,event){
 if(event.effect!==c.effect)return false;
 require('./native-effects').play(v,c.slashAsset,v.root,target.node.position.x,target.node.position.y+c.offsetY,{size:c.slashSize,duration:c.slashDuration,frameIndices:c.slashFrames,color:c.slashColor,widthRatio:c.slashWidth,heightRatio:c.slashHeight,angle:require('./hero-vfx').direction(v.actors.get(event.actor),target)});return true;
}
/** 斩数与伤害合为一条暴击样式飘字，仅表示段数，不改变实际暴击判定。 */
function damageText(v,target,event){
 if(event.effect!==c.effect)return false;
 const label=c.slashLabels[event.slashIndex-1]||c.slashLabels[0];
 require('./combat-text').show(v,target,event.damage,'damage',true,false,{prefix:label+' '});return true;
}
module.exports={move,hit,damageText};
