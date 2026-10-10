'use strict';
const c=require('./equipment-paper-config');
/** 装备说明使用素色纸面与细边框，标题区不再叠加装饰纹样。 */
function create(v,parent,name,x,y,width,height,style=c){const n=v.ui.box(parent,name,x,y,width,height,style.fill,false),g=n.getComponent(v.cc.Graphics);g.strokeColor=new v.cc.Color(style.border);g.lineWidth=style.lineWidth;g.roundRect(-width/2+style.inset,-height/2+style.inset,width-style.inset*2,height-style.inset*2,style.corner);g.stroke();return n;}
module.exports={create};
