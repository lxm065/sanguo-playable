'use strict';
const c=require('./equipment-vfx-config'),native=require('./native-effects');
/** 变羊替换可见模型但保留血条和位置，到期、死亡与场景销毁均恢复或清理。 */
function hex(v,actor,event){if(!actor?.node?.isValid)return;const body=actor.body,active=actor.hexEffect?actor.hexBodyActive:body?.active;actor.hexEffect?.destroy();const n=native.play(v,'sheep',actor.node,0,c.sheep.y,{size:c.sheep.size,loop:true,duration:event.duration});if(!n)return;actor.hexEffect=n;actor.hexBodyActive=active;if(body)body.active=false;n.once(v.cc.Node.EventType.NODE_DESTROYED,()=>{if(actor.hexEffect!==n)return;actor.hexEffect=null;if(body?.isValid)body.active=active;});}
/** 装备施放使用真实目标，纯属性装备无需伪造周期施法。 */
function cast(v,event){if(event.id===require('./equipment-chain-config').id)return require('./equipment-chain-view').show(v,event);const rule=c.cast[event.id],source=v.actors.get(event.uid),target=rule?.self?source:v.actors.get(event.target);if(!rule||!target?.node?.isValid||event.id==='7111'||event.id==='7109')return;native.play(v,rule.effect,target.node,0,40,{duration:c.duration});}
module.exports={hex,cast};
