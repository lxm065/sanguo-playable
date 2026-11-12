'use strict';
const c=require('./progress-bar-config');
/** 底槽和填充共用局部坐标；按实际宽高限制圆角，空进度不画绿色。 */
function draw(v,parent,ratio,layout){
 const {x,y,width,height}=layout,name=layout.name||'progress',padding=Math.max(0,Math.min(layout.padding??c.padding,height/2,width/2));
 const value=Number.isNaN(ratio)?0:Math.max(0,Math.min(1,ratio)),root=v.ui.node(parent,name+'-bg',x,y,width,height),g=root.addComponent(v.cc.Graphics);
 g.fillColor=new v.cc.Color(layout.trackColor||c.trackColor);g.roundRect(-width/2,-height/2,width,height,Math.min(width,height)/2);g.fill();
 const innerWidth=width-padding*2,innerHeight=height-padding*2,fillWidth=innerWidth*value,fillHeight=Math.min(innerHeight,fillWidth),fill=v.ui.node(root,name+'-fill',0,0,width,height);
 fill.active=fillWidth>0&&innerHeight>0;
 if(fill.active){const ink=fill.addComponent(v.cc.Graphics);ink.fillColor=new v.cc.Color(layout.fillColor||c.fillColor);ink.roundRect(-innerWidth/2,-fillHeight/2,fillWidth,fillHeight,fillHeight/2);ink.fill();}
 return {root,fill};
}
module.exports={draw};
