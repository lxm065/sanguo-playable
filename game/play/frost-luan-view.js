'use strict';
const c=require('./frost-luan-view-config'),shell=require('./shield-shell-view'),native=require('./native-effects');
/** 回收目标身上的冰晶盾前后层；不影响其他来源的护盾表现。 */
function remove(v,a){for(const n of a?.frostLuanNodes||[]){v.cc.Tween.stopAllByTarget(n);if(n.isValid)n.destroy();}if(a)a.frostLuanNodes=[];}
/** 记录飞行和展扇节点，用回放时钟统一推进和销毁。 */
function transient(v,node,t,duration,extra={}){const state={node,start:t,until:t+duration,opacity:node.addComponent(v.cc.UIOpacity),...extra};(v.frostLuanFlights||(v.frostLuanFlights=[])).push(state);return state;}
/** 展开冰扇并放出霜鸾；冰晶护盾覆盖目标全身，命中破盾单独播放爆裂。 */
function cast(v,e){
 const target=v.actors.get(e.target),source=v.actors.get(e.uid);if(!target?.node?.isValid)return;remove(v,target);
 if(e.phase==='end')return;
 if(e.phase==='burst'){
  const p=target.node.position;native.play(v,c.burst,v.root,p.x,p.y,{size:c.burstSize,duration:c.burstDuration,color:c.color});
  for(let i=0;i<c.shards;i++){const angle=i*Math.PI*2/c.shards;native.play(v,'coldArrow',v.root,p.x,p.y,{size:c.shardSize,duration:c.shardDuration,angle:angle*180/Math.PI,color:c.color,travel:{x:p.x+Math.cos(angle)*c.shardDistance,y:p.y+Math.sin(angle)*c.shardDistance},fadeOut:.6});}return;
 }
 if(target.alive===false)return;
 if(source?.node?.isValid){
  const p=source.node.position,fan=v.ui.image(v.root,c.fan,p.x,p.y+c.fanY,c.fanSize,c.fanSize);transient(v,fan,e.t,c.fanDuration,{fan:true});
  const bird=v.ui.image(v.root,c.bird,p.x,p.y+c.birdY,c.birdSize,c.birdSize);transient(v,bird,e.t,c.travel,{target:target.node,x:p.x,y:p.y+c.birdY});
 }
 const back=v.ui.node(target.node,'frost-luan-back',0,c.y),front=v.ui.node(target.node,'frost-luan-front',0,c.y);target.frostLuanNodes=[back,front];target.frostLuanUntil=e.t+e.duration;back.setSiblingIndex(0);
 if(target.status?.getSiblingIndex)front.setSiblingIndex(target.status.getSiblingIndex());
 shell.draw(v,back.addComponent(v.cc.Graphics),c,false);shell.draw(v,front.addComponent(v.cc.Graphics),c,true);shell.pulse(v,back,c);shell.pulse(v,front,c,true);
}
/** 飞鸟追踪受护者当前位置；倍速变化共用战斗时钟，不让粒子滞留。 */
function update(v){
 v.frostLuanFlights=(v.frostLuanFlights||[]).filter(s=>{
  if(!s.node.isValid)return false;if(v.elapsed>=s.until||s.target&&!s.target.isValid){s.node.destroy();return false;}
  const p=Math.max(0,(v.elapsed-s.start)/(s.until-s.start));s.opacity.opacity=Math.round(255*Math.min(1,(1-p)*4));
  if(s.target){const q=s.target.position;s.node.setPosition(s.x+(q.x-s.x)*p,s.y+(q.y+c.birdY-s.y)*p);s.node.angle=Math.atan2(q.y+c.birdY-s.y,q.x-s.x)*180/Math.PI;s.node.setScale(1,1+Math.sin(p*Math.PI*4)*.12,1);}else if(s.fan){const scale=.65+.35*Math.min(1,p*4);s.node.setScale(scale,scale,1);}return true;
 });
 for(const a of v.actors.values())if(a.frostLuanNodes?.length&&(a.alive===false||v.elapsed>=a.frostLuanUntil))remove(v,a);
}
/** 离开回放清理所有飞行素材和持续护盾。 */
function clear(v){for(const a of v.actors?.values?.()||[])remove(v,a);for(const s of v.frostLuanFlights||[])if(s.node.isValid)s.node.destroy();v.frostLuanFlights=[];}
module.exports={cast,update,remove,clear};
