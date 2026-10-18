'use strict';
const style=require('./weapon-exclusive-config')['7101'].visual;
/** 用透明矢量爱心表达魅惑，不引入黑底贴图或额外资源加载。 */
function heart(v,parent,x,y){
 const node=v.ui.node(parent,'exclusive-charm-heart',x,y),g=node.addComponent(v.cc.Graphics),s=style.size;
 g.fillColor=new v.cc.Color(style.color);g.strokeColor=new v.cc.Color(style.outline);g.lineWidth=style.lineWidth;
 g.moveTo(0,-s*.45);g.bezierCurveTo(-s*.9,s*.1,-s*.4,s*.85,0,s*.35);g.bezierCurveTo(s*.4,s*.85,s*.9,s*.1,0,-s*.45);g.close();g.fill();g.stroke();
 return node;
}
/** 死亡、控制到期和页面退出共用清理，停止补间以防残留。 */
function remove(v,actor){if(actor?.charmIcon){v.cc.Tween.stopAllByTarget(actor.charmIcon);if(actor.charmIcon.isValid)actor.charmIcon.destroy();delete actor.charmIcon;}}
/** 爱心飞行对应施法，头顶心形仅在真实命中后出现并持续到控制结束。 */
function cast(v,e){
 const a=v.actors.get(e.uid),b=v.actors.get(e.target);
 if(e.phase==='end'){remove(v,b);return;}
 if(!b?.node?.isValid||b.alive===false)return;
 if(e.phase==='impact'){remove(v,b);b.charmIcon=heart(v,b.status||b.node,0,style.y);return;}
 if(!a?.node?.isValid)return;
 const p=a.node.position,q=b.node.position;v.ui.face(a,q.x-p.x,q.y-p.y);v.ui.animate(a,style.animation,false,{speed:v.speed,duration:e.duration});
 const node=heart(v,v.root,p.x,p.y+style.y);v.effectNodes=(v.effectNodes||[]).filter(n=>n.isValid);v.effectNodes.push(node);
 v.cc.tween(node).to(e.duration/(v.speed||1),{position:new v.cc.Vec3(q.x,q.y+style.y,0)}).call(()=>{if(node.isValid)node.destroy();}).start();
}
/** 回放切换时清理所有魅惑标记。 */
function clear(v){for(const a of v.actors?.values?.()||[])remove(v,a);}
module.exports={cast,remove,clear};
