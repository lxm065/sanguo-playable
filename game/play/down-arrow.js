'use strict';
const p=require('./home-march-config').guide;
/** 首页和行军地图共用下箭头轮廓与浮动节奏；节点销毁即停止动画。 */
function draw(v,parent,y=p.arrowY){const cc=v.cc,n=v.ui.node(parent,'down-arrow',0,y,p.width,p.height),ink=n.addComponent(cc.Graphics);ink.fillColor=new cc.Color(p.color);ink.strokeColor=new cc.Color(p.outline);ink.lineWidth=p.outlineWidth;p.points.forEach(([x,z],i)=>i?ink.lineTo(x*p.width,z*p.height):ink.moveTo(x*p.width,z*p.height));ink.close();ink.fill();ink.stroke();const tween=cc.tween(n).repeatForever(cc.tween().to(p.seconds,{position:new cc.Vec3(0,y-p.bounce,0)}).to(p.seconds,{position:new cc.Vec3(0,y,0)})).start();n.on(cc.Node.EventType.NODE_DESTROYED,()=>tween.stop());return n;}
module.exports={draw};
