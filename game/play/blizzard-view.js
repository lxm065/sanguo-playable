'use strict';
const c=require('./blizzard-view-config');
/** 记录施法时的区域中心，不随目标移动把暴风雪变成追踪弹。 */
function begin(v,source,target,event){if(!source||!target?.node.isValid)return;const p=target.node.position;(v.blizzardCasts||(v.blizzardCasts=new Map())).set(source.unit.uid,{x:p.x,y:p.y,t:event.t,lastWave:null});}
/** 同一施法者同一伤害时刻只铺一波落冰，多个受伤目标不重复堆特效。 */
function wave(v,source,target,event){if(!target?.node.isValid)return;const id=source?.unit.uid??event.actor,casts=v.blizzardCasts||(v.blizzardCasts=new Map());let cast=casts.get(id);if(!cast){const p=target.node.position;cast={x:p.x,y:p.y,t:event.t,lastWave:null};casts.set(id,cast);}if(cast.lastWave===event.t)return;cast.lastWave=event.t;const count=cast.wave||0;cast.wave=count+1;const native=require('./native-effects');for(let i=0;i<c.offsets.length;i++){const offset=c.offsets[(i+count*c.rotationStep)%c.offsets.length];native.play(v,'blizzard',v.root,cast.x+offset[0],cast.y+offset[1]+c.groundOffset,{size:c.size,duration:c.duration,delay:i*c.stagger});}}
module.exports={begin,wave};
