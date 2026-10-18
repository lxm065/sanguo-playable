'use strict';
const c=require('./xuchu-aura-config'),shell=require('./shield-shell-view');
/** 死亡、刷新和回放退出统一结束护盾，避免补间或粒子残留。 */
function remove(v,a){if(!a)return;for(const key of ['exclusiveShield','xuchuShieldFront','xuchuFlame']){const n=a[key];if(n){v.cc.Tween.stopAllByTarget(n);if(n.isValid)n.destroy();delete a[key];}}delete a.xuchuAuraUntil;}
/** 以角色居中锚点包裹全身，后层柔光与前层反光共同构成透明护罩。 */
function play(v,a,e){
 remove(v,a);if(!a?.node?.isValid||a.alive===false)return;
 const back=v.ui.node(a.node,'xuchu-shield-back',0,c.y),front=v.ui.node(a.node,'xuchu-shield-front',0,c.y);
 a.exclusiveShield=back;a.xuchuShieldFront=front;a.xuchuAuraUntil=(e.t??v.elapsed??0)+e.duration;back.setSiblingIndex(0);
 if(a.status?.getSiblingIndex)front.setSiblingIndex(a.status.getSiblingIndex());
 shell.draw(v,back.addComponent(v.cc.Graphics),c,false);shell.draw(v,front.addComponent(v.cc.Graphics),c,true);shell.pulse(v,back,c);shell.pulse(v,front,c);
}
/** 每场战斗结束后清理所有椭圆护盾节点。 */
function clear(v){for(const a of v.actors?.values?.()||[])remove(v,a);}
/** 按战报时钟到期，即使途中进入决胜加速也与三秒无敌状态一致。 */
function update(v){for(const a of v.actors?.values?.()||[])if(a.xuchuAuraUntil!==undefined&&v.elapsed>=a.xuchuAuraUntil)remove(v,a);}
module.exports={play,remove,clear,update};
