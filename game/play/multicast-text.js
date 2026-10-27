'use strict';
const c=require('./multicast-text-config');
/** 创建完整单行字样，描边和阴影共用同一布局，避免倍率被拆开。 */
function label(v,parent,text,x,y,color){
 const l=v.ui.text(parent,text,x,y,c.font,color,c.width,c.height);l.enableWrapText=false;l.overflow=v.cc.Label.Overflow.SHRINK;l.isBold=true;
 const outline=l.node.addComponent(v.cc.LabelOutline);outline.color=new v.cc.Color(c.outline);outline.width=c.outlineWidth;return l;
}
/** 回收冲击文字及透明度补间，重复触发和离场都不会遗留节点。 */
function remove(v,n){if(!n?.isValid)return;v.cc.Tween.stopAllByTarget(n);const alpha=n.getComponent(v.cc.UIOpacity);if(alpha)v.cc.Tween.stopAllByTarget(alpha);if(n.isValid)n.destroy();}
/** 只响应真实多重施法事件；弹出、回弹、停顿和上浮形成独立于普通提示的冲击节奏。 */
function show(v,a,count){
 if(!a?.node?.isValid||!Number.isInteger(count)||count<2)return;
 const tier=[...c.tiers].reverse().find(t=>count>=t.count)||c.tiers[0],p=a.node.position,speed=v.speed||1;
 remove(v,a.multicastCaption);const all=v.multicastCaptions=(v.multicastCaptions||[]).filter(n=>n.isValid);while(all.length>=c.maxNodes)remove(v,all.shift());
 const extent=c.width*tier.peak/2+c.edgePadding,half=v.config?.layout?.width/2,limit=Number.isFinite(half)?Math.max(0,half-extent):Infinity,x=Math.max(-limit,Math.min(limit,p.x));
 const n=v.ui.node(v.root,'multicast-impact',x,p.y+c.y),text=c.text.replace('{count}',count);
 label(v,n,text,c.shadowX,c.shadowY,c.shadow);label(v,n,text,0,0,tier.color);
 const alpha=n.addComponent(v.cc.UIOpacity);a.multicastCaption=n;all.push(n);n.angle=c.initialAngle;n.setScale(c.initialScale,c.initialScale,1);
 v.cc.tween(n).to(c.enter/speed,{scale:new v.cc.Vec3(tier.peak,tier.peak,1),angle:c.settleAngle},{easing:'quadOut'}).to(c.settle/speed,{scale:new v.cc.Vec3(1,1,1),angle:-c.settleAngle}).to(c.rebound/speed,{angle:0}).delay(c.hold/speed).by(c.fade/speed,{position:new v.cc.Vec3(0,c.rise,0)}).call(()=>remove(v,n)).start();
 v.cc.tween(alpha).delay((c.enter+c.settle+c.rebound+c.hold)/speed).to(c.fade/speed,{opacity:0}).start();
}
/** 离开战斗立即停止全部冲击文字，避免浮字越过结算界面。 */
function clear(v){for(const n of v.multicastCaptions||[])remove(v,n);v.multicastCaptions=[];}
module.exports={show,clear};
