'use strict';
const c=require('./dianwei-skill-config'),native=require('./native-effects');
/** 恢复被抛起的模型本地位置；归位身体旋转并对齐已结算落点，血条不参与翻滚。 */
function restore(v,body){const state=v.dianweiTosses?.get(body);if(!state)return;state.tween?.stop();state.travel?.stop();if(body.isValid){body.setPosition(state.origin.x,state.origin.y,state.origin.z);body.angle=state.angle;}if(state.node?.isValid&&state.destination)state.node.setPosition(state.destination.x,state.destination.y,0);v.dianweiTosses.delete(body);}
/** 一技能用真实模型的抛物线表现抓起与落下，整圈翻滚与平移共用命中前摇。 */
function cast(v,source,event){
 if(event.effect!==c.effect||!event.skill)return false;
 const target=v.actors.get(event.target);if(!target?.body?.isValid)return true;
 const body=target.body,cc=v.cc;restore(v,body);
 const origin={x:body.position.x,y:body.position.y,z:body.position.z},duration=(event.toss?.duration??v.config.attackDelay)/v.speed,angle=body.angle||0,destination=event.toss?v.position(event.toss.to.x,event.toss.to.y):null,roll=c.visual.rollDegrees*(destination&&destination.x<target.node.position.x?-1:1);
 v.dianweiTosses=v.dianweiTosses||new Map();const state={origin,angle,node:target.node,destination};v.dianweiTosses.set(body,state);
 if(destination){cc.Tween.stopAllByTarget(target.node);state.travel=cc.tween(target.node).to(duration,{position:new cc.Vec3(destination.x,destination.y,0)}).start();}
 state.tween=cc.tween(body).to(duration*c.visual.ascentRatio,{position:new cc.Vec3(origin.x,origin.y+c.visual.height,origin.z),angle:angle+roll*c.visual.ascentRatio},{easing:'quadOut'}).to(duration*(1-c.visual.ascentRatio),{position:new cc.Vec3(origin.x,origin.y,origin.z),angle:angle+roll},{easing:'quadIn'}).call(()=>restore(v,body)).start();
 const q=source.node.position;native.play(v,c.visual.trail,v.root,q.x,q.y+c.visual.offsetY,{size:c.visual.trailSize,duration:c.visual.trailDuration,frameIndices:c.visual.trailFrames,angle:require('./hero-vfx').direction(source,target)});
 return true;
}
/** 范围伤害各自播放落地冲击，复用已有地裂资源。 */
function hit(v,target,event){if(event.effect!==c.effect)return false;const p=target.node.position;native.play(v,c.visual.impact,v.root,p.x,p.y+c.visual.offsetY,{size:c.visual.impactSize,duration:c.visual.impactDuration});return true;}
/** 退出、跳过及重新开始战斗时终止所有抛掷并还原模型，避免悬空残留。 */
function clear(v){for(const body of v.dianweiTosses?.keys()||[])restore(v,body);}
module.exports={cast,hit,clear,restore};
