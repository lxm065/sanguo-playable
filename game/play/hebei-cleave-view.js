'use strict';
const c=require('./northern-weapons-view-config').blade.fan,rule=require('./northern-weapons-config').blade;
/** 将真实攻击方向的弧线投影到棋盘，视觉不改变命中范围。 */
function geometry(v,e){const o=v.position(0,0),x=v.position(1,0),y=v.position(0,1),angle=Math.atan2(e.dy,e.dx),half=rule.halfAngle*Math.PI/180,r=rule.radius*c.radiusScale;
 return Array.from({length:c.segments+1},(_,i)=>{const a=angle-half+i*half*2/c.segments,dx=Math.cos(a)*r,dy=Math.sin(a)*r;return {x:(x.x-o.x)*dx+(y.x-o.x)*dy,y:(x.y-o.y)*dx+(y.y-o.y)*dy};});}
/** 从配置颜色生成带透明度的刀光材质。 */
function color(v,hex,alpha){return new v.cc.Color(hex+Math.round(alpha).toString(16).padStart(2,'0'));}
/** 挥刀头部沿弧线前进，尾部追随消失；尖端收窄，不绘制扇区填充或径向边线。 */
function draw(v,g,points,progress){g.clear();const head=progress*(1+c.trail),tail=head-c.trail;
 for(const layer of c.layers){const outer=[],inner=[];for(let i=0;i<points.length;i++){const t=i/(points.length-1);if(t<tail||t>head)continue;const age=(t-tail)/c.trail,width=Math.pow(Math.sin(Math.PI*age),c.taper)*layer.width,p=points[i];outer.push({x:p.x*(1+width*c.outerSpread),y:p.y*(1+width*c.outerSpread)});inner.push({x:p.x*(1-width),y:p.y*(1-width)});}
 if(outer.length<2)continue;g.fillColor=color(v,layer.color,layer.opacity);g.moveTo(outer[0].x,outer[0].y);for(const p of outer.slice(1))g.lineTo(p.x,p.y);for(const p of inner.reverse())g.lineTo(p.x,p.y);g.close();g.fill();}}
/** 单道月牙刀光快速扫过后收尾，倍速及销毁跟随战斗生命周期。 */
function play(v,a,e){const points=geometry(v,e),p=a.node.position,n=v.ui.node(v.root,'hebei-cleave-fan',p.x,p.y),g=n.addComponent(v.cc.Graphics),state={progress:0};draw(v,g,points,0);
 v.cc.tween(state).to(c.duration/(v.speed||1),{progress:1},{onUpdate:()=>{if(n.isValid)draw(v,g,points,state.progress);}}).call(()=>{if(n.isValid)n.destroy();}).start();n.once(v.cc.Node.EventType.NODE_DESTROYED,()=>v.cc.Tween.stopAllByTarget(state));(v.effectNodes||(v.effectNodes=[])).push(n);return n;}
module.exports={geometry,draw,play};
