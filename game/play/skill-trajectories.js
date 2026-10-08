'use strict';
const c=require('./skill-presentation-config'),native=require('./native-effects');
/** 从施法点到目标点铺原生闪电/火浪帧，按距离排列，不用几何圆圈代替。 */
function beam(v,a,b,key){const p=c.beams[key];if(!p||!a?.node?.isValid||!b?.node?.isValid)return;const from=a.node.position,to=b.node.position,dx=to.x-from.x,dy=to.y-from.y;if(p.texture){const n=v.ui.image(v.root,p.texture,(from.x+to.x)/2,(from.y+to.y)/2,Math.hypot(dx,dy),p.width);n.angle=Math.atan2(dy,dx)*180/Math.PI;const alpha=n.addComponent(v.cc.UIOpacity),tw=v.cc.tween(alpha).to(p.seconds/(v.speed||1),{opacity:0}).call(()=>{if(n.isValid)n.destroy();}).start();n.once(v.cc.Node.EventType.NODE_DESTROYED,()=>tw.stop());return;}const count=Math.max(1,Math.ceil(Math.hypot(dx,dy)/p.spacing));for(let i=1;i<=count;i++)native.play(v,p.id,v.root,from.x+dx*i/count,from.y+dy*i/count,{size:p.size,duration:p.seconds,delay:key==='flameWave'?i/count*p.seconds:0,angle:Math.atan2(dy,dx)*180/Math.PI});}
/** LoL原钩头网格与线缆纹理沿真实目标往返，结束立即销毁。 */
function hook(v,a,b,duration){if(!a?.node?.isValid||!b?.node?.isValid)return;const p=c.hook,from=a.node.position,to=b.node.position,dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy),angle=Math.atan2(dy,dx)*180/Math.PI,seconds=duration||p.seconds;
 const layer=v.ui.node(v.root,'hook-trajectory',from.x,from.y+p.offsetY),line=v.ui.image(layer,p.cable,0,0,Math.max(1,length),p.width);layer.angle=angle;line.setPosition(length/2,0);line.setScale(.001,1,1);
 const head=native.play(v,p.head,layer,0,0,{size:p.size,duration:seconds,angle:p.angle});
 const progress={value:0},update=()=>{if(!layer.isValid)return;const distance=length*progress.value;line.setScale(Math.max(.001,progress.value),1,1);line.setPosition(distance/2,0);if(head?.isValid)head.setPosition(distance,0);};
 const tween=v.cc.tween(progress).to(seconds*p.returnRatio/(v.speed||1),{value:1},{onUpdate:update}).to(seconds*(1-p.returnRatio)/(v.speed||1),{value:0},{onUpdate:update}).call(()=>{if(layer.isValid)layer.destroy();}).start();layer.once(v.cc.Node.EventType.NODE_DESTROYED,()=>tween.stop());
}
module.exports={beam,hook};
