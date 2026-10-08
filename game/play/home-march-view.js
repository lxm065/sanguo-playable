'use strict';
const c=require('./home-march-config');
/** 按当前章显示已完成、行军中和下一站，后续未配置地名使用章号。 */
function sites(state){const current=Math.max(1,state.chapter||1),last=current+1;return Array.from({length:last},(_,i)=>{const chapter=i+1,known=c.sites.find(s=>s.chapter===chapter),pos=known||c.continuation[(chapter-1)%c.continuation.length];return {...pos,chapter,name:known?.name||'第'+chapter+'章',active:chapter===current,complete:chapter<=state.cleared,locked:chapter>current};}).filter(s=>s.chapter>=Math.max(1,current-1));}
/** 用原有勾号与字符战斗标记呈现章节状态，保留原章节入口，只有当前章节可进入路线。 */
function render(v){const u=v.ui,cc=v.cc,state=v.progress.state,nodes=sites(state),root=u.node(v.root,'home-march'),g=root.addComponent(cc.Graphics),active=nodes.find(s=>s.active);u.text(root,state.chapter+'.'+active.name,0,c.titleY,c.titleFont,'#F4E2B6',500,55);for(let i=1;i<nodes.length;i++){const a=nodes[i-1],b=nodes[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/c.lineSpacing);g.fillColor=new cc.Color(b.locked?'#6E644F':c.lineColor);for(let j=1;j<steps;j++){const t=j/steps;g.circle(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,4);g.fill();}}
 for(const s of nodes){
  const node=u.node(root,'chapter-'+s.chapter,s.x,s.y,150,180);
  if(s.locked)node.addComponent(cc.UIOpacity).opacity=130;
  u.image(node,'classic/'+(s.active?'flag-active':'flag')+'.png',0,0,c.flagWidth,c.flagHeight);
  if(s.complete)u.text(node,c.markers.complete,0,10,52,c.completeColor,90,65);
  if(s.active){u.text(node,c.markers.battle,0,5,40,c.ringColor,100,60);const ring=u.node(node,'march-ring',0,c.ringY),ink=ring.addComponent(cc.Graphics);ink.strokeColor=new cc.Color(c.ringColor);ink.lineWidth=4;ink.circle(0,0,c.ringRadius);ink.stroke();const pulse=cc.tween(ring).repeatForever(cc.tween().to(c.pulseSeconds,{scale:new cc.Vec3(c.pulseScale,c.pulseScale,1)}).to(c.pulseSeconds,{scale:new cc.Vec3(1,1,1)})).start();node.on(cc.Node.EventType.NODE_DESTROYED,()=>pulse.stop());}
  u.text(node,s.name,0,c.labelY,c.font,'#EEDAA7',180,40);
  if(s.active){u.text(node,'第'+s.chapter+'章：'+state.section+'/'+require('./classic-config').chapter.sections.length,0,c.progressY,c.font,'#FFF0B0',280,44);node.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;v.page='map';v.mapOffset=0;v.render();});}else if(s.locked)u.text(node,'未抵达',0,c.progressY,23,'#BAAE91',180,40);
 }
 return root;}
module.exports={sites,render};
