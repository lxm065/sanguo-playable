'use strict';
const c=require('./home-label-config'),map=require('./home-region-config');
/** 顶部章节号只显示一次，有正式地名时补充地名。 */
function title(site){return (site.name==='第'+site.chapter+'章'?c.title:c.namedTitle).replace('{chapter}',site.chapter).replace('{name}',site.name);}
/** 同一节点的名称与小节进度合并为一条信息，不重复章节号。 */
function text(site,state,total){return site.active?c.progress.replace('{name}',site.name).replace('{section}',state.section).replace('{total}',total):site.name;}
/** 矩形相交检测共用于相邻标签和建筑避让。 */
function overlaps(a,b){return Math.abs(a.x-b.x)<(a.width+b.width)/2+c.padding&&Math.abs(a.y-b.y)<(a.height+b.height)/2+c.padding;}
/** 当前节点优先，其他节点按章节顺序放置；所有坐标保持在同一地图层。 */
function layout(sites){const placed=[],result=new Map();for(const site of [...sites].sort((a,b)=>Number(b.active)-Number(a.active)||a.chapter-b.chapter)){const width=site.active?c.activeWidth:c.width;const nearby=[];for(let x=-c.searchRadius;x<=c.searchRadius;x+=c.searchStep)for(let y=-c.searchRadius;y<=c.searchRadius;y+=c.searchStep)if(Math.hypot(x,y)>=c.buildingHeight)nearby.push([x,y]);nearby.sort((a,b)=>Math.hypot(...a)-Math.hypot(...b));const offsets=[...c.offsets,...nearby,...Array.from({length:c.fallbackRows},(_,i)=>[0,c.offsets[0][1]-(i+3)*c.fallbackStep])];let box;for(const [dx,dy]of offsets){const candidate={x:Math.max(-map.viewport.width/2+width/2+c.edge,Math.min(map.viewport.width/2-width/2-c.edge,site.x+dx)),y:site.y+dy,width,height:c.height};if(placed.some(p=>overlaps(candidate,p)))continue;if(sites.some(other=>other!==site&&overlaps(candidate,{x:other.x,y:other.y,width:c.buildingWidth,height:c.buildingHeight})))continue;box=candidate;break;}if(!box)throw Error('章节标签缺少可用位置');placed.push(box);result.set(site.chapter,{...box,dx:box.x-site.x,dy:box.y-site.y});}return result;}
module.exports={title,text,layout,overlaps};
