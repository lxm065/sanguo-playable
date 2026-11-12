'use strict';
/** 仅回收上次备战席拥有的节点和演员，保留战场模型、HUD 与背景。 */
function begin(v,retain=false){
 const previous=v.reserveScope;
 v.reserveReuse=retain?new Map():null;
 v.reserveIndex=previous?.nodes.find(n=>n.isValid&&n.parent===v.root)?.getSiblingIndex?.();
 if(previous){
  require('./merge-hints').clear(v,new Set(previous.actors.keys()));
  for(const [id,actor] of previous.actors)if(v.actors.get(id)===actor){v.actors.delete(id);if(retain&&actor.node.isValid)v.reserveReuse.set(id,actor);}
  const kept=new Set([...(v.reserveReuse?.values()||[])].map(a=>a.node));
  for(const n of previous.nodes)if(n.isValid&&!kept.has(n)){n.removeFromParent();n.destroy();}
 }
 const before=new Set(v.root.children);for(const actor of v.reserveReuse?.values()||[])before.delete(actor.node);return before;
}
/** 记录本次局部绘制的所有节点；翻页时补回装备和合成提示。 */
function end(v,before,refresh=false){
 for(const [id,actor]of v.reserveReuse||[]){if(v.actors.get(id)===actor)v.actors.delete(id);if(actor.node.isValid){actor.node.removeFromParent();actor.node.destroy();}}
 v.reserveReuse=null;
 const nodes=v.root.children.filter(n=>!before.has(n)),owned=new Set(nodes);
 if(v.reserveIndex!==undefined)nodes.forEach((n,i)=>n.setSiblingIndex(v.reserveIndex+i));
 v.reserveIndex=undefined;
 const actors=new Map([...v.actors].filter(([,a])=>owned.has(a.node)));
 v.reserveScope={nodes,actors};
 if(refresh){for(const a of actors.values())v.battleHud?.renderEquipped(a.unit);if(!v.playing&&!v.model.state.pending)require('./merge-hints').show(v,new Set(actors.keys()));}
}
module.exports={begin,end};
