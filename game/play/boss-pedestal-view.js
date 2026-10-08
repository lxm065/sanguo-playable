'use strict';
const p=require('./boss-map-config').pedestal;
/** 绘制有体积的椭圆石台层，侧面和台面分色以区分高度。 */
function tier(g,cc,x,y,rx,ry,depth,face,top,edge){g.fillColor=new cc.Color(face);g.ellipse(x,y-depth,rx,ry);g.fill();g.rect(x-rx,y-depth,rx*2,depth);g.fill();g.fillColor=new cc.Color(top);g.strokeColor=new cc.Color(edge);g.lineWidth=p.rimWidth;g.ellipse(x,y,rx,ry);g.fill();g.stroke();}
/** 青石叠台配青铜镶边、铆钉和刻纹；纯矢量避免新增大纹理。 */
function render(v,parent){const cc=v.cc,n=v.ui.node(parent,'boss-pedestal'),g=n.addComponent(cc.Graphics),w=p.width,h=p.height;
 g.fillColor=new cc.Color(p.shadow);g.ellipse(0,p.shadowY,w*p.shadowScale,h);g.fill();
 tier(g,cc,0,-5,w,h,p.depth,p.stoneDark,p.stoneLight,p.rim);
 g.strokeColor=new cc.Color(p.jointColor);g.lineWidth=2;
 for(let i=1;i<p.joints;i++){const a=Math.PI+i*Math.PI/p.joints,x=Math.cos(a)*w,y=Math.sin(a)*h-5;g.moveTo(x,y);g.lineTo(x,y-p.depth+2);g.stroke();}
 tier(g,cc,0,0,w*p.innerScale,h*p.innerScale,7,p.inner,p.top,p.light);
 g.strokeColor=new cc.Color(p.inner);g.lineWidth=2;g.ellipse(0,0,w*p.faceScale,h*p.faceScale);g.stroke();
 for(let i=0;i<p.studs;i++){const a=i*2*Math.PI/p.studs;g.fillColor=new cc.Color(p.light);g.circle(Math.cos(a)*w*.92,Math.sin(a)*h*.92-5,p.studRadius);g.fill();}
 g.strokeColor=new cc.Color(p.rim);g.lineWidth=1.5;
 for(let i=0;i<p.runeCount;i++){const a=i*2*Math.PI/p.runeCount;g.moveTo(Math.cos(a)*w*p.runeInner,Math.sin(a)*h*p.runeInner);g.lineTo(Math.cos(a)*w*p.runeOuter,Math.sin(a)*h*p.runeOuter);g.stroke();}
 return n;
}
module.exports={render};
