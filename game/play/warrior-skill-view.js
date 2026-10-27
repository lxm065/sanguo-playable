'use strict';
const c=require('./warrior-view-config'),native=require('./native-effects');
/** 使用已有原始沙尘、震地模型表现持续风沙、蓄力和真实冲击。 */
function ability(v,a,target,e){if(!a?.node.isValid)return false;const p=a.node.position;
 if(e.effect==='sandstorm'){native.play(v,'whirlwind',v.root,0,0,{follow:a.node,size:c.sand.size,color:c.sand.color,duration:e.duration,loop:true});return true;}
 if(e.effect==='epicenter'){native.play(v,'earthImpact',v.root,0,0,{follow:a.node,size:c.charge.size,color:c.charge.color,duration:e.impactDelay,loop:true});return true;}
 if(e.impactOnly){native.play(v,e.effect==='infectionBurst'?'decay':'earthImpact',v.root,p.x,p.y,{size:c.pulse.size,duration:c.pulse.duration});return true;}return false;}
/** 隐身仅淡化身体，血条与施法范围仍可辨认，时间跟随回放倍速。 */
function status(v,a,e){if(e.effect!=='sandVeil'||!a?.body.isValid)return false;const opacity=a.body.getComponent(v.cc.UIOpacity)||a.body.addComponent(v.cc.UIOpacity);opacity.opacity=c.sand.opacity;a.sandVeilEnd=e.t+e.duration;return true;}
/** 回放时钟统一恢复隐身透明度，避免独立定时器跨场景遗留。 */
function update(v){for(const a of v.actors.values())if(a.sandVeilEnd!==undefined&&v.elapsed>=a.sandVeilEnd){if(a.body.isValid){const opacity=a.body.getComponent(v.cc.UIOpacity);if(opacity)opacity.opacity=255;}delete a.sandVeilEnd;}}
module.exports={ability,status,update};
