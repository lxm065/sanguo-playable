'use strict';
const config=require('./native-effect-config').whirlMotion,motion=require('./model-animation');
/** 结束旋转时恢复朝向与最新动作；死亡角色保持死亡动作。 */
function restore(entry,speed){
 const a=entry.actor;if(!a.node.isValid||!a.alive)return;
 a.facing=entry.facing;a.updateLayout?.();
 const animation=a.currentAnimation||entry.animation;
 if(animation)motion.animate(a,animation.name,animation.loop,{...animation.options,speed});
}
/** 按竖轴方向切换原角色模型，不旋转血条、装备、名字或整个屏幕精灵。 */
function tick(v,now=Date.now()){
 for(const [uid,e] of v.whirlMotions||[]){
  e.elapsed+=(now-e.last)/1000*(v.speed||1);e.last=now;
  const a=e.actor;
  if(!a.node.isValid||!a.alive||e.elapsed>=e.duration){restore(e,v.speed||1);v.whirlMotions.delete(uid);continue;}
  const steps=config.directions,step=Math.floor(e.elapsed/config.turnSeconds*steps.length),facing=steps[(e.startIndex+step)%steps.length];
  if(a.facing===facing&&e.step===step)continue;e.step=step;a.facing=facing;a.updateLayout?.();
  if(a.sp.skeletonData){a.sp.setCompleteListener(null);a.sp.timeScale=v.speed||1;a.sp.setAnimation(0,motion.animationKey(config.animation,facing,a.directional),true);}
 }
 if(!v.whirlMotions?.size){clearInterval(v.whirlTimer);v.whirlTimer=null;}
}
/** 重复触发合并到同一旋转状态，持续时间只影响表现，不改变战斗事件。 */
function play(v,actor,duration){
 if(!actor?.node.isValid||!actor.alive)return;
 v.whirlMotions=v.whirlMotions||new Map();const old=v.whirlMotions.get(actor.unit.uid);
 v.whirlMotions.set(actor.unit.uid,{actor,duration,elapsed:0,last:Date.now(),facing:old?.facing||actor.facing,animation:actor.currentAnimation,startIndex:Math.max(0,config.directions.indexOf(actor.facing))});
 tick(v);if(!v.whirlTimer)v.whirlTimer=setInterval(()=>tick(v),config.frameInterval);
}
/** 离场及战斗结束取消计时器，恢复仍存活的武将。 */
function clear(v){clearInterval(v.whirlTimer);v.whirlTimer=null;for(const entry of v.whirlMotions?.values()||[])restore(entry,v.speed||1);v.whirlMotions?.clear();}
module.exports={play,tick,clear};
