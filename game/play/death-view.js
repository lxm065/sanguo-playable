'use strict';
const c=require('./death-view-config'),motion=require('./model-animation');
/** 返回按当前倍速折算的死亡展示时长，不影响模拟器战斗时间。 */
function duration(actor,speed=1){const key=motion.animationKey('dead',actor.facing,actor.directional),seconds=actor.manifest?.actions?.[key]?.duration;return Math.min(seconds>0?seconds:c.fallbackSeconds,c.maxSeconds)/Math.max(1,speed);}
/** 立即隐藏血条，死亡动作后整体淡出；销毁场景会停止待执行动画。 */
function hide(v,actor){if(actor.deathRemoval)return;const cc=v.cc;actor.alive=false;for(const [key,n]of Object.entries(actor))if(key.startsWith('status-')&&n?.isValid)n.destroy();if(actor.status)actor.status.active=false;if(actor.frozenEffect?.isValid)actor.frozenEffect.destroy();cc.Tween.stopAllByTarget(actor.node);v.ui.animate(actor,'dead',false,{speed:v.speed});const opacity=actor.node.getComponent(cc.UIOpacity)||actor.node.addComponent(cc.UIOpacity);actor.deathRemoval=cc.tween(opacity).delay(duration(actor,v.speed)).to(c.fadeSeconds/Math.max(1,v.speed||1),{opacity:0}).call(()=>{if(actor.node.isValid)actor.node.active=false;}).start();actor.node.once(cc.Node.EventType.NODE_DESTROYED,()=>actor.deathRemoval.stop());}
module.exports={hide,duration};
