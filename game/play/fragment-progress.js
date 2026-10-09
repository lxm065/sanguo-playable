'use strict';
const c=require('./fragment-progress-config');
/** 将真实碎片数绘制为封顶进度，保留超额数字与原点击广告入口。 */
function draw(book,parent,item,y,label){const u=book.ui,cc=book.cc,n=u.node(parent,'equipment-fragment-bar',0,y,c.width,c.height),g=n.addComponent(cc.Graphics),ratio=item.max?1:Math.max(0,Math.min(1,item.fragments/Math.max(1,item.cost?.fragments||1)));
 g.fillColor=new cc.Color(c.track);g.strokeColor=new cc.Color(c.edge);g.lineWidth=c.outline;g.roundRect(-c.width/2,-c.height/2,c.width,c.height,c.radius);g.fill();g.stroke();
 const width=(c.width-c.inset*2)*ratio,height=c.height-c.inset*2;if(width>0){g.fillColor=new cc.Color(c.fill);g.roundRect(-c.width/2+c.inset,-height/2,width,height,Math.min(height/2,width/2));g.fill();g.fillColor=new cc.Color(c.shine);g.roundRect(-c.width/2+c.inset+2,height/2-7,Math.max(0,width-4),4,2);g.fill();}
 const icon=u.node(n,'fragment-puzzle',c.iconX,0,c.iconSize,c.iconSize),ink=icon.addComponent(cc.Graphics);ink.fillColor=new cc.Color(c.gold);ink.strokeColor=new cc.Color(c.iconEdge);ink.lineWidth=c.outline;c.points.forEach(([x,z],i)=>i?ink.lineTo(x*c.iconSize,z*c.iconSize):ink.moveTo(x*c.iconSize,z*c.iconSize));ink.close();ink.fill();ink.stroke();icon.setRotationFromEuler(0,0,-18);
 const text=u.text(n,label,0,0,c.font,c.text,c.width-20,c.height);text.lineHeight=c.font;text.isBold=true;const outline=text.node.addComponent(cc.LabelOutline);outline.color=new cc.Color(c.edge);outline.width=c.outline;return n;}
module.exports={draw};
