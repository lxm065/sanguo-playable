'use strict';
const config=require('./skill-presentation-config'),icons=require('./handbook-detail-assets').icons;
/** 技能状态按武将显示策略过滤；同一状态刷新时间，不改变技能效果。 */
function show(v,actor,e){
 if(!actor?.node?.isValid)return;
 const id=e.skillId||config.passive[e.effect]||config.stateSkills[e.effect],file=icons[id];if(!file)return;
 if(config.status.hiddenSkills?.includes(String(id))||config.status.hiddenSkillsByHero?.[actor.unit.heroId]?.includes(String(id)))return remove(v,actor,[String(id)]);
 const all=v.skillStatuses||(v.skillStatuses=[]),key=actor.unit.uid+':'+id,old=all.find(x=>x.key===key);
 if(old){old.remaining=e.duration||config.visualDuration;return;}
 const c=config.status,parent=actor.status||actor.node,n=v.ui.image(parent,file,0,c.y,c.size,c.size);
 n.name='skill-status-'+id;const entry={key,node:n,actor,remaining:e.duration||config.visualDuration};all.push(entry);layout(v,actor);
 if(!v.skillStatusTimer){v.skillStatusLast=Date.now();v.skillStatusTimer=setInterval(()=>tick(v),c.interval);}
}
/** 按单位重排图标，避开模型中心；装备和技能状态使用不同节点。 */
function layout(v,actor){const c=config.status,rows=(v.skillStatuses||[]).filter(x=>x.actor===actor&&x.node.isValid);rows.forEach((e,i)=>e.node.setPosition((i%c.columns-(Math.min(rows.length,c.columns)-1)/2)*c.gap,c.y+Math.floor(i/c.columns)*c.gap));}
/** 使用实际回放倍速推进，死亡、离场、到期统一清理。 */
function tick(v){const now=Date.now(),dt=(now-v.skillStatusLast)/1000*(v.speed||1);v.skillStatusLast=now;const changed=new Set();v.skillStatuses=(v.skillStatuses||[]).filter(e=>{e.remaining-=dt;if(!e.node.isValid||!e.actor.alive||e.remaining<=0){if(e.node.isValid)e.node.destroy();changed.add(e.actor);return false;}return true;});for(const a of changed)layout(v,a);if(!v.skillStatuses.length){clearInterval(v.skillStatusTimer);v.skillStatusTimer=null;}}
/** 离开回放时不保留计时器和图标，不修改模型与存档。 */
function clear(v){clearInterval(v.skillStatusTimer);v.skillStatusTimer=null;for(const e of v.skillStatuses||[])if(e.node.isValid)e.node.destroy();v.skillStatuses=[];}
/** 多重施法和叠层使用明确短提示，避免玩家只能看到重复伤害。 */
function announce(v,actor,text){if(!actor?.node?.isValid)return;if(actor.skillCaption?.isValid)actor.skillCaption.destroy();const c=config.badge,n=v.ui.text(actor.node,text,0,c.y,c.font,c.color,c.width,40).node;actor.skillCaption=n;v.cc.tween(n).by(c.seconds/(v.speed||1),{position:new v.cc.Vec3(0,c.rise,0)}).call(()=>{if(n.isValid)n.destroy();}).start();n.once(v.cc.Node.EventType.NODE_DESTROYED,()=>v.cc.Tween.stopAllByTarget(n));}
/** 驱散删除已解除的控制图标，其他增益保持原时长。 */
function remove(v,actor,ids){v.skillStatuses=(v.skillStatuses||[]).filter(e=>{if(e.actor===actor&&ids.some(id=>e.key===actor.unit.uid+':'+id)){if(e.node.isValid)e.node.destroy();return false;}return true;});layout(v,actor);}
module.exports={show,clear,announce,tick,remove};
