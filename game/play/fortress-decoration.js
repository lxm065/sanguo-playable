'use strict';
const config=require('./fortress-decoration-config');
/** 将标题中心和字号锁定在原纸纹标题带内，避免各卡片分别猜坐标。 */
function title(v,parent,text,height){
 const c=config.title,size=Math.min(c.maxFont,Math.max(c.minFont,height*c.fontRatio));
 const label=v.ui.text(parent,text,0,height*c.centerRatio,size,c.color,parent.getComponent(v.cc.UITransform).width-80,height*c.heightRatio);
 label.isBold=true;label.lineHeight=size;const outline=label.node.addComponent(v.cc.LabelOutline);outline.color=new v.cc.Color(c.outline);outline.width=c.outlineWidth;return label;
}
/** 绘制红底金字锯齿折扣章，数字保持动态，不烘焙或改变真实价格。 */
function discount(v,parent,value,x){
 if(!Number.isFinite(value)||value<=0||value>=10)return null;
 const c=config.discount,n=v.ui.node(parent,'discount-badge',x+c.x,c.y,c.width,c.height),g=n.addComponent(v.cc.Graphics);
 g.fillColor=new v.cc.Color(c.fill);g.strokeColor=new v.cc.Color(c.edge);g.lineWidth=c.lineWidth;
 c.points.forEach(([px,py],i)=>i?g.lineTo(px*c.width,py*c.height):g.moveTo(px*c.width,py*c.height));g.close();g.fill();g.stroke();
 for(const [text,px,py,font,width] of [[value,c.numberX,c.numberY,c.font,45],['折',c.suffixX,c.suffixY,c.suffixFont,30]]){
  const l=v.ui.text(n,text,px,py,font,c.gold,width,c.height);l.isBold=true;l.lineHeight=font;const outline=l.node.addComponent(v.cc.LabelOutline);outline.color=new v.cc.Color(c.edge);outline.width=c.lineWidth;
 }
 n.setRotationFromEuler(0,0,c.rotation);return n;
}
module.exports={title,discount};
