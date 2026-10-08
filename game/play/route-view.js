"use strict";
const config=require('./route-view-config'),graph=require('./route-graph');
/** 为节点添加交错展示坐标，逻辑坐标和路线选择规则保持原样。 */
function position(node){return {x:node.x+(config.rowShifts[node.row%config.rowShifts.length]||0),y:config.baseY+node.y+(node.lane===0?config.rowStagger:node.lane===2?-config.rowStagger:0)};}
/** 查询本小节确实完成的节点；旧存档没有记录时不伪造分支。 */
function history(state){return state.route?.key===state.chapter+'-'+state.section?state.route.nodes:[];}
/** 生成弯曲点线路径，端点留白让旗帜清晰可见。 */
function dots(from,to){const a=position(from),b=position(to),count=Math.max(3,Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/config.dotSpacing));return Array.from({length:count-1},(_,i)=>{const t=(i+1)/count;return {x:a.x+(b.x-a.x)*t+Math.sin(t*Math.PI)*config.bend*(from.lane===0?-1:1),y:a.y+(b.y-a.y)*t};});}
/** 绘制普通分支和真实行军轨迹，在最近完成节点显示主公头像。 */
function renderRoutes(view,content,nodes){
 const u=view.ui,cc=view.cc,state=view.progress.state,visited=history(state);
 const g=u.node(content,'paths').addComponent(cc.Graphics);
 const edges=[];
 for(const from of nodes)for(const to of nodes.filter(n=>graph.connected(from,n,state)))edges.push({from,to,available:from.id===visited[visited.length-1]&&view.progress.accessible(to),done:visited.some((id,i)=>id===from.id&&visited[i+1]===to.id)});
 // 迁移后的历史可能跨越新增行，按真实记录补画，不将中间节点伪标为已完成。
 for(let i=0;i<visited.length;i++){const from=nodes.find(n=>n.id===visited[i]);const targets=i+1<visited.length?nodes.filter(n=>n.id===visited[i+1]):nodes.filter(n=>view.progress.accessible(n));for(const to of targets){if(from&&from.row<to.row&&!edges.some(e=>e.from.id===from.id&&e.to.id===to.id))edges.push({from,to,done:i+1<visited.length,available:i+1===visited.length});}}
 for(const edge of edges.sort((a,b)=>Number(a.done)-Number(b.done))){g.fillColor=new cc.Color(edge.done?config.traveled:edge.available?config.available:config.normal);g.strokeColor=new cc.Color(config.outline);g.lineWidth=2;for(const p of dots(edge.from,edge.to)){g.ellipse(p.x,p.y,config.radiusX,config.radiusY);g.fill();if(edge.done)g.stroke();}}

 return new Set(visited);
}
/** 在路径上绘制圆形主公位置标记，放在节点之后避免被旗帜遮挡。 */
function renderCurrent(view,content,nodes){
 const u=view.ui,cc=view.cc,state=view.progress.state,visited=history(state);
 const current=nodes.find(n=>n.id===state.activeNode)||nodes.find(n=>n.id===visited[visited.length-1]);
 if(!current)return;
 const p=position(current),size=config.avatarSize,x=p.x+(p.x>0?-1:1)*config.avatarOffsetX,y=p.y-config.avatarOffsetY;
 u.image(content,'classic/avatar-frame.png',x,y,size+16,size+16);
 const avatar=u.node(content,'march-lord',x,y,size,size);avatar.addComponent(cc.Mask).type=cc.Mask.Type.ELLIPSE;
 u.portrait(avatar,view.progress.lord().portrait,0,0,size,size,require('./classic-config').portraitCrop);
}
/** 已到达与已通过共用亮态贴图，未经过的分支保持灰态。 */
function markerIcon(type,active,done){if(type==='treasure'&&done)return 'classic/treasure-opened.png';const pair=require("./route-config").markerIcons[type];return "classic/"+(pair?pair[active||done?1:0]:type)+".png";}
module.exports={markerIcon,position,history,dots,renderRoutes,renderCurrent};
