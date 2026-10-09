'use strict';
const c=require('./home-march-config');
/** 按区域展示完整连续六站，当前章节不再在三个坐标间循环。 */
function sites(state,page=null){const current=Math.max(1,state.chapter||1),highest=Math.max(current,(state.cleared||0)+1),lastPage=Math.floor((highest-1)/c.pageSize),selected=page===null?Math.floor((current-1)/c.pageSize):Math.max(0,Math.min(lastPage,page)),start=selected*c.pageSize;return c.continuation.map((pos,i)=>{const chapter=start+i+1;return {...pos,chapter,name:c.sites.find(s=>s.chapter===chapter)?.name||'第'+chapter+'章',active:chapter===current,complete:chapter<=state.cleared,locked:chapter>highest};});}
/** 仅第一章当前入口显示可点击的下箭头；跟随父入口处理触摸并释放动画。 */
function guide(v,parent,state){const p=c.guide;if(state.chapter!==p.chapter)return;const u=v.ui,cc=v.cc,n=u.node(parent,'chapter-click-guide'),label=u.text(n,p.text,0,p.textY,p.font,p.color,100,40),outline=label.node.addComponent(cc.LabelOutline);outline.color=new cc.Color(p.outline);outline.width=p.outlineWidth;label.isBold=true;require('./down-arrow').draw(v,n);}
/** 用配置的完成与双剑图片呈现章节状态，保留原章节入口，已通关入口可确认重玩，当前入口直接继续路线。 */
function render(v){const u=v.ui,cc=v.cc,state=v.progress.state,nodes=sites(state,v.homeChapterPage??null),root=u.node(v.root,'home-march'),g=root.addComponent(cc.Graphics),active=nodes.find(s=>s.active);const replay=require('./chapter-replay-config'),first=nodes[0].chapter,page=Math.floor((first-1)/c.pageSize),highest=Math.max(state.chapter,(state.cleared||0)+1),lastPage=Math.floor((highest-1)/c.pageSize);u.text(root,active?state.chapter+'.'+active.name:replay.rangeTitle.replace('{first}',first).replace('{last}',nodes.at(-1).chapter),0,c.titleY,c.titleFont,'#F4E2B6',500,55);for(const [delta,label]of [[-1,replay.pager.previous],[1,replay.pager.next]]){if(page+delta<0||page+delta>lastPage)continue;const b=u.node(root,'chapter-page-'+delta,delta*replay.pager.x,replay.pager.y,replay.pager.width,replay.pager.height);u.text(b,label,0,0,replay.pager.font,'#F4E2B6',replay.pager.width,replay.pager.height);b.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;v.homeChapterPage=page+delta;v.render();});}for(let i=1;i<nodes.length;i++){const a=nodes[i-1],b=nodes[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/c.lineSpacing);g.fillColor=new cc.Color(b.locked?'#6E644F':c.lineColor);for(let j=1;j<steps;j++){const t=j/steps;g.circle(a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t,4);g.fill();}}
 for(const s of nodes){
  const node=u.node(root,'chapter-'+s.chapter,s.x,s.y,150,180);
  if(s.locked)node.addComponent(cc.UIOpacity).opacity=130;
  u.image(node,'classic/'+(s.active?'flag-active':'flag')+'.png',0,0,c.flagWidth,c.flagHeight);
  if(s.complete)u.image(node,c.markers.complete,0,c.markers.y,c.markers.width,c.markers.height);
  if(s.active){u.image(node,c.markers.battle,0,c.markers.y,c.markers.battleWidth,c.markers.battleHeight);guide(v,node,state);const ring=u.node(node,'march-ring',0,c.ringY),ink=ring.addComponent(cc.Graphics);ink.strokeColor=new cc.Color(c.ringColor);ink.lineWidth=4;ink.circle(0,0,c.ringRadius);ink.stroke();const pulse=cc.tween(ring).repeatForever(cc.tween().to(c.pulseSeconds,{scale:new cc.Vec3(c.pulseScale,c.pulseScale,1)}).to(c.pulseSeconds,{scale:new cc.Vec3(1,1,1)})).start();node.on(cc.Node.EventType.NODE_DESTROYED,()=>pulse.stop());}
  u.text(node,s.name,0,c.labelY,c.font,'#EEDAA7',180,40);
  if(s.active){u.text(node,'第'+s.chapter+'章：'+state.section+'/'+require('./classic-config').chapter.sections.length,0,c.progressY,c.font,'#FFF0B0',280,44);node.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;v.page='map';v.mapOffset=0;v.render();});}else if(!s.locked){node.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;require('./chapter-replay-view').show(v,s.chapter);});}
 }
 return root;}
module.exports={sites,render};
