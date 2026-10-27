'use strict';
const c=require('./northern-weapons-view-config'),rules=require('./northern-weapons-config'),native=require('./native-effects');
/** 清除蓄刀状态，死亡、消费及离场使用同一入口。 */
function remove(a){if(a?.hebeiReady?.isValid)a.hebeiReady.destroy();if(a)a.hebeiReady=null;}
/** 按实际事件播放蓄刀、挥刀、落地冲击或贯穿箭，不额外计算伤害。 */
function cast(v,e){const a=v.actors.get(e.uid),b=v.actors.get(e.target);if(!a?.node?.isValid)return;const p=a.node.position,q=b?.node?.position||p,angle=Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI;
 if(e.id===rules.blade.id){if(e.phase==='ready'){remove(a);a.hebeiReady=native.play(v,c.ready.effect,a.node,0,c.y,{size:c.ready.size,duration:e.duration,loop:true,color:c.ready.color});}
 else if(e.phase==='swing'){remove(a);v.ui.face(a,q.x-p.x,q.y-p.y);v.ui.animate(a,c.blade.animation,false,{speed:v.speed,duration:e.duration});native.play(v,c.blade.slash,a.node,0,c.y,{size:c.blade.size,duration:e.duration,angle,color:c.blade.color});}
 else if(e.phase==='impact'){require('./hebei-cleave-view').play(v,a,e);}else remove(a);return;}
 if(e.phase!=='fire')return;const o=v.position(0,0),x=v.position(1,0),y=v.position(0,1),dx=((x.x-o.x)*e.dx+(y.x-o.x)*e.dy)*e.range,dy=((x.y-o.y)*e.dx+(y.y-o.y)*e.dy)*e.range,aim=Math.atan2(dy,dx)*180/Math.PI;
 for(const offset of [-c.bow.trailOffset,c.bow.trailOffset])native.play(v,c.bow.trail,v.root,p.x,p.y+c.y+offset,{size:c.bow.trailSize,duration:e.duration,angle:aim,color:c.bow.color,travel:{x:p.x+dx,y:p.y+c.y+dy+offset}});
 native.play(v,c.bow.effect,v.root,p.x,p.y+c.y,{size:c.bow.size,duration:e.duration,angle:aim,color:c.bow.color,travel:{x:p.x+dx,y:p.y+c.y+dy}});
}
/** 只在实际伤害事件命中时播放刀刃闪光或冰晶碎裂。 */
function hit(v,target,e){const blade=e.effect===rules.blade.effect;if(!blade&&e.effect!==rules.bow.effect)return false;native.play(v,blade?c.blade.slash:c.bow.hit,target.node,0,c.y,{size:blade?c.blade.size:c.bow.hitSize,duration:blade?c.blade.duration:c.bow.hitDuration,color:blade?c.blade.color:c.bow.color});return true;}
module.exports={cast,hit,remove};
