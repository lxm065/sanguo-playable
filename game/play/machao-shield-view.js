'use strict';
const c=require('./weapon-exclusive-config')['7007'].visual,native=require('./native-effects'),shell=require('./shield-shell-view');
/** 破盾、爆炸、死亡和离场统一终止蓄能补间与粒子节点。 */
function remove(v,a){if(!a)return;for(const key of ['furnaceShell','furnaceEnergy']){const n=a[key];if(n){v.cc.Tween.stopAllByTarget(n);if(n.isValid)n.destroy();delete a[key];}}}
/** 红色全身护盾脉动蓄能，爆炸时在当前落脚点扩散火焰与冲击波。 */
function cast(v,e){
 const a=v.actors.get(e.uid);if(!a)return;remove(v,a);
 if(e.phase==='end'||!a.node?.isValid)return;
 if(e.phase==='explode'){
  const p=a.node.position;native.play(v,c.explode,v.root,p.x,p.y+c.explodeY,{size:c.explodeSize,duration:c.explodeDuration,color:c.color,fadeOut:.5});
  native.play(v,c.blast,v.root,p.x,p.y,{size:c.blastSize,duration:c.blastDuration,color:c.color,fadeOut:.5});return;
 }
 if(a.alive===false)return;
 const back=v.ui.node(a.node,'machao-furnace-shell',0,c.y),front=v.ui.node(a.node,'machao-furnace-membrane',0,c.y);
 a.furnaceShell=back;a.furnaceEnergy=front;back.setSiblingIndex(0);
 if(a.status?.getSiblingIndex)front.setSiblingIndex(a.status.getSiblingIndex());
 shell.draw(v,back.addComponent(v.cc.Graphics),c,false);shell.draw(v,front.addComponent(v.cc.Graphics),c,true);
 shell.pulse(v,back,c);shell.pulse(v,front,c,true);
}
/** 全场回放重置时移除持续护盾，不让旧节点进入下一场战斗。 */
function clear(v){for(const a of v.actors?.values?.()||[])remove(v,a);}
module.exports={cast,remove,clear};
