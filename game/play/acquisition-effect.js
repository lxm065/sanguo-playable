'use strict';
const hero=require('./hero-unlock-config'),equipment=require('./lord-skill-animation-config');
/** 获取反馈复用武将解锁和主公获得装备的光芒参数，不产生奖励或文字。 */
function play(v,parent,kind,x,y,radius=null){const c=kind==='equipment'?{count:equipment.rays.count,radius:equipment.rays.outer,arc:equipment.rays.arc,color:equipment.rays.color,seconds:equipment.rays.seconds}:{count:hero.rays,radius:hero.radius,arc:Math.PI/hero.rays,color:hero.rayColor,seconds:hero.turnSeconds};if(radius!==null)c.radius=radius;const n=v.ui.node(parent,'acquisition-rays',x,y),g=n.addComponent(v.cc.Graphics);g.fillColor=new v.cc.Color(c.color);for(let i=0;i<c.count;i++){const a=i*Math.PI*2/c.count;g.moveTo(0,0);g.lineTo(Math.cos(a)*c.radius,Math.sin(a)*c.radius);g.lineTo(Math.cos(a+c.arc)*c.radius,Math.sin(a+c.arc)*c.radius);g.close();g.fill();}const spin=v.cc.tween(n).by(c.seconds,{angle:360}).repeatForever().start();n.on(v.cc.Node.EventType.NODE_DESTROYED,()=>spin.stop());return spin;}
module.exports={play};
