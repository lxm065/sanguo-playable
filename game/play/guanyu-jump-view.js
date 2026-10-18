'use strict';
const c=require('./guanyu-jump-config');
/** 结束视觉锁并还原身体位置，死亡时由原死亡动作接管。 */
function reset(v,a,idle=false){if(!a?.guanyuJump)return;const state=a.guanyuJump;delete a.guanyuJump;delete a.animationLock;if(a.body?.isValid){v.cc.Tween.stopAllByTarget(a.body);a.body.setPosition(state.x,state.y);}if(idle&&a.alive!==false&&a.node?.isValid)v.ui.animate(a,'idle',true,{speed:v.speed});}
/** 上升蓄刀、下落劈刀、落地收势；密集阵亡不反复打断正在进行的下劈。 */
function play(v,a,target,e){
 if(!a.body?.isValid||a.guanyuJump)return;
 if(target?.node?.isValid)v.ui.face(a,target.node.position.x-a.node.position.x,target.node.position.y-a.node.position.y);
 const body=a.body,base={x:body.position.x,y:body.position.y},duration=e.duration,speed=v.speed||1,sign=body.scale.x<0?-1:1;
 a.guanyuJump=base;a.animationLock=c.animation;v.cc.Tween.stopAllByTarget(body);
 v.ui.animate(a,c.animation,false,{speed,duration:duration*(1+c.recovery)});
 v.cc.tween(body).to(duration*c.windup/speed,{position:new v.cc.Vec3(base.x,base.y-c.crouch,0)})
 .to(duration*(c.ascent-c.windup)/speed,{position:new v.cc.Vec3(base.x,base.y+c.height,0)},{easing:c.easing.rise})
 .delay(duration*(c.apex-c.ascent)/speed).call(()=>{
  if(!body.isValid||a.alive===false)return;
  require('./native-effects').play(v,c.blade,a.node,c.bladeX*sign,c.height+c.bladeTop,{size:c.bladeSize,duration:duration*(1-c.apex),frameIndices:c.bladeFrames,color:c.color,angle:c.bladeAngle*sign,widthRatio:c.bladeWidth,heightRatio:c.bladeHeight,travel:{x:c.bladeX*sign,y:c.bladeBottom}});
 }).to(duration*(1-c.apex)/speed,{position:new v.cc.Vec3(base.x,base.y,0)},{easing:c.easing.fall}).delay(duration*c.recovery/speed).call(()=>reset(v,a,true)).start();
}
/** 页面切换和回放结束统一撤销跳劈补间及视觉锁。 */
function clear(v){for(const a of v.actors?.values?.()||[])reset(v,a);}
module.exports={play,reset,clear};
