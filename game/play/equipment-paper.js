'use strict';
const c=require('./equipment-paper-config');
/** 装备说明使用素色纸面与细边框，标题区不再叠加装饰纹样。 */
function create(v,parent,name,x,y,width,height){const n=v.ui.box(parent,name,x,y,width,height,c.fill,false),g=n.getComponent(v.cc.Graphics);g.strokeColor=new v.cc.Color(c.border);g.lineWidth=c.lineWidth;g.roundRect(-width/2+c.inset,-height/2+c.inset,width-c.inset*2,height-c.inset*2,c.corner);g.stroke();return n;}
module.exports={create};
