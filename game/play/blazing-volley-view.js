'use strict';
const c=require('./blazing-volley-view-config'),native=require('./native-effects');
/** 五刃在头顶展开后俯射目标，蓄势和飞行都包含在原命中延迟内。 */
function cast(v,a,b,e){const p=a.node.position,q=b.node.position,delay=e.impactDelay||v.config.attackDelay,charge=delay*c.chargeRatio,flight=delay-charge;const states=v.blazingVolleys||(v.blazingVolleys=new Map());states.set(e.uid,{x:q.x,y:q.y,landed:false});
 c.slots.forEach(([x,y],i)=>{const start={x:p.x+x,y:p.y+y},end={x:q.x+c.landings[i][0],y:q.y+c.landings[i][1]},angle=Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI;
 native.play(v,c.blade,v.root,start.x,start.y,{size:c.chargeSize,duration:charge,angle,color:c.edge,frameIndices:c.chargeFrames});
 native.play(v,c.flame,v.root,start.x,start.y,{size:c.trailSize,duration:flight,delay:charge,travel:end,angle,color:c.fire,fadeOut:c.fade});
 native.play(v,c.blade,v.root,start.x,start.y,{size:c.bladeSize,duration:flight,delay:charge,travel:end,angle,color:c.edge,frameIndices:c.bladeFrames,fadeOut:c.fade});});}
/** 透明叠层焦痕留在地面渐隐，不制造持续伤害或遮盖角色。 */
function scorch(v,state){const n=v.ui.node(v.root,'blazing-scorch',state.x,state.y),g=n.addComponent(v.cc.Graphics),o=n.addComponent(v.cc.UIOpacity);n.setSiblingIndex(0);for(const layer of c.ash.layers){g.fillColor=new v.cc.Color(c.ash.color+layer.alpha.toString(16).padStart(2,'0'));g.ellipse(0,0,c.ash.rx*layer.scale,c.ash.ry*layer.scale);g.fill();}v.cc.tween(o).to(c.scorch.duration/(v.speed||1),{opacity:0}).call(()=>{if(n.isValid)n.destroy();}).start();n.once(v.cc.Node.EventType.NODE_DESTROYED,()=>v.cc.Tween.stopAllByTarget(o));(v.effectNodes||(v.effectNodes=[])).push(n);}
/** 仅真实命中触发一次区域爆焰及焦痕，各受伤敌人仍有短促火星反馈。 */
function hit(v,a,b,e){const state=v.blazingVolleys?.get(e.actor??a.unit.uid);if(state&&!state.landed){state.landed=true;scorch(v,state);const n=native.play(v,c.scorch.id,v.root,state.x,state.y,{size:c.scorch.size,duration:c.scorch.duration,color:c.scorch.color,heightRatio:c.scorch.height,fadeOut:c.scorch.fade});if(n?.setSiblingIndex)n.setSiblingIndex(0);for(const layer of [c.impact,c.shock])native.play(v,layer.id,v.root,state.x,state.y,{size:layer.size,duration:layer.duration,color:c.fire,fadeOut:c.fade});}native.play(v,c.hit.id,b.node,0,c.hitY,{size:c.hit.size,duration:c.hit.duration,color:c.fire,fadeOut:c.fade});}
/** 离场清除本次施法定位，节点与补间由原生特效池统一回收。 */
function clear(v){v.blazingVolleys?.clear();}
module.exports={cast,hit,clear};
