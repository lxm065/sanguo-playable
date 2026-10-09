'use strict';
/** 仅回收上次备战席拥有的节点和演员，保留战场模型、HUD 与背景。 */
function begin(v){
 const previous=v.reserveScope;
 if(previous){
  require('./merge-hints').clear(v,new Set(previous.actors.keys()));
  for(const [id,actor] of previous.actors)if(v.actors.get(id)===actor)v.actors.delete(id);
  for(const n of previous.nodes)if(n.isValid){n.removeFromParent();n.destroy();}
 }
 return new Set(v.root.children);
}
/** 记录本次局部绘制的所有节点；翻页时补回装备和合成提示。 */
function end(v,before,refresh=false){
 const nodes=v.root.children.filter(n=>!before.has(n)),owned=new Set(nodes);
 const actors=new Map([...v.actors].filter(([,a])=>owned.has(a.node)));
 v.reserveScope={nodes,actors};
 if(refresh){for(const a of actors.values())v.battleHud?.renderEquipped(a.unit);require('./merge-hints').show(v,new Set(actors.keys()));}
}
module.exports={begin,end};
