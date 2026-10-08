'use strict';
const c=require('./diamond-reward-config');
/** 仅在到账成功后播放装饰动效，动画中断或重复绘制都不参与发奖。 */
function show(v,amount){if(amount<=0)return;const u=v.ui,cc=v.cc,layer=u.node(v.root,'diamond-reward-effect'),tweens=[],target=new cc.Vec3(c.targetX,c.targetY,0);for(let i=0;i<c.count;i++){const a=i*Math.PI*2/c.count,n=u.image(layer,'classic/diamond.png',0,c.originY,c.size,c.size),p=new cc.Vec3(Math.cos(a)*c.spreadX,Math.sin(a)*c.spreadY+c.originY,0);tweens.push(cc.tween(n).to(c.scatterSeconds,{position:p},{easing:'quadOut'}).delay(c.holdSeconds+i*c.stagger).to(c.flySeconds,{position:target,scale:new cc.Vec3(.55,.55,1)},{easing:'quadIn'}).call(()=>n.destroy()).start());}tweens.push(cc.tween(layer).delay(c.scatterSeconds+c.holdSeconds+c.flySeconds+c.count*c.stagger).call(()=>layer.destroy()).start());layer.on(cc.Node.EventType.NODE_DESTROYED,()=>tweens.forEach(t=>t.stop()));return layer;}
module.exports={show};
