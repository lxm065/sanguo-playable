'use strict';
const c=require('./weapon-exclusive-config'),native=require('./native-effects'),row=require('./buff-icon-row'),rowStyle=require('./buff-icon-row-config');
/** 移除死亡或已消费的增益图标，不影响其他技能状态。 */
function remove(actor){row.remove(actor,'strategy');if(actor?.strategyIcon?.isValid)actor.strategyIcon.destroy();if(actor)actor.strategyIcon=null;}
/** 战斗结束或离场时移除全军策略图标。 */
function clear(v){for(const a of v.actors?.values?.()||[]){require('./northern-weapons-view').remove(a);row.clear(a);remove(a);}}
/** 用独立父节点缩放身体，转向和受击动作不会覆盖嗜血体型；结束恢复原层级。 */
function rage(v,a,enabled){
 row.remove(a,'rage');if(a.rageIcon?.isValid)a.rageIcon.destroy();a.rageIcon=null;
 if(!enabled){if(a.rageBody?.isValid){if(a.body?.isValid){a.body.setParent(a.rageBody.parent);if(a.rageBodyOrder!==undefined)a.body.setSiblingIndex(a.rageBodyOrder);}a.rageBody.destroy();}a.rageBody=null;delete a.rageBodyOrder;return;}
 const r=c['7002'],style=c.visual;
 if(a.body?.isValid&&!a.rageBody?.isValid){const order=a.body.getSiblingIndex?.();a.rageBodyOrder=order;a.rageBody=v.ui.node(a.body.parent,'dianwei-rage-body',0,0);if(order!==undefined)a.rageBody.setSiblingIndex(order);a.body.setParent(a.rageBody);a.rageBody.setScale(r.bodyScale,r.bodyScale,1);}
 a.rageIcon=v.ui.image(a.status||a.node,style.icon,0,rowStyle.y,rowStyle.size,rowStyle.size);a.rageIcon.name='dianwei-bloodlust';row.attach(v,a,'rage',a.rageIcon);
}
/** 专属事件驱动实际动作与状态，所有循环特效沿用统一清理时钟。 */
function cast(v,e){
 if(!e.exclusive)return false;
 if(e.id==='7004'||e.id==='7209'){require('./northern-weapons-view').cast(v,e);return true;}
 if(e.id==='7006'){require('./mechanism-volley-view').cast(v,e);return true;}
 if(e.id==='7110'){require('./frost-luan-view').cast(v,e);return true;}
 if(e.id==='7007'){require('./machao-shield-view').cast(v,e);return true;}
 if(e.id==='7101'){require('./charm-exclusive-view').cast(v,e);return true;}
 const a=v.actors.get(e.uid),b=v.actors.get(e.target),style=c.visual;if(!a?.node?.isValid)return true;
 if(e.id==='7005'){if(b?.node?.isValid){const r=c['7005'];v.ui.face(a,b.node.position.x-a.node.position.x,b.node.position.y-a.node.position.y);v.ui.animate(a,r.animation,false,{speed:v.speed,duration:e.duration,startProgress:r.animationStart});}return true;}
 if(e.id==='7002'){rage(v,a,!e.consume&&a.alive!==false);return true;}
 if(e.id==='7104'){
  if(!b?.node?.isValid)return true;if(e.phase==='end'){remove(b);return true;}if(b.strategyIcon?.isValid&&e.consume)return true;remove(b);if(b.alive!==false){b.strategyIcon=v.ui.image(b.status||b.node,style.icon,0,rowStyle.y,rowStyle.size,rowStyle.size);b.strategyIcon.name='exclusive-strategy';row.attach(v,b,'strategy',b.strategyIcon);}return true;
 }
 if(e.id==='7206'){require('./xuchu-aura-view').play(v,a,e);return true;}
 if(e.id==='7208'&&b?.node?.isValid){const p=a.node.position,q=b.node.position;v.ui.face(a,q.x-p.x,q.y-p.y);v.ui.animate(a,style.arrowAnimation,false,{speed:v.speed});native.play(v,style.arrow,v.root,p.x,p.y+style.arrowY,{size:style.arrowSize,duration:e.duration,angle:Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI,travel:{x:q.x,y:q.y+style.arrowY},followTarget:b.node,targetOffsetY:style.arrowY});return true;}
 if(e.id==='7003'){require('./guanyu-jump-view').play(v,a,b,e);return true;}
 return true;
}
/** 专属追斩和火箭命中使用与真实伤害一致的特效，不再另发伤害。 */
function hit(v,target,e){if(require('./northern-weapons-view').hit(v,target,e))return true;if(e.effect===c['7006'].effect){require('./mechanism-volley-view').hit(v,target,e);return true;}const style=c.visual;if(e.effect===c['7005'].effect){const r=c['7005'];native.play(v,r.slash,v.root,target.node.position.x,target.node.position.y+r.slashY,{size:r.slashSize,duration:r.interval,color:r.slashColor,angle:require('./hero-vfx').direction(v.actors.get(e.actor),target)});return true;}if(e.effect===c['7003'].effect){native.play(v,style.slash,target.node,0,style.arrowY,{size:style.slashSize,duration:c['7003'].delay,color:style.shieldColor});return true;}if(e.effect===c['7208'].effect){native.play(v,'flame',target.node,0,style.arrowY,{size:style.arrowSize,duration:c['7208'].delay});return true;}return false;}
/** 死亡时立即回收全身护盾和待消费图标。 */
function death(v,e){if(e.type!=='death')return;const a=v.actors.get(e.uid);require('./mechanism-volley-view').death(v,e.uid);require('./frost-luan-view').remove(v,a);row.clear(a);remove(a);require('./xuchu-aura-view').remove(v,a);require('./machao-shield-view').remove(v,a);require('./charm-exclusive-view').remove(v,a);require('./guanyu-jump-view').reset(v,a);if(a)rage(v,a,false);if(a?.exclusiveShield?.isValid)a.exclusiveShield.destroy();if(a?.body?.isValid&&a.exclusiveJumpBase){v.cc.Tween.stopAllByTarget(a.body);a.body.setPosition(a.exclusiveJumpBase.x,a.exclusiveJumpBase.y);delete a.exclusiveJumpBase;}}
module.exports={cast,hit,death,clear};
