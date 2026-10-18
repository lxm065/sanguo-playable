'use strict';
const config=require('./lord-entry-skill-config'),{random}=require('./combat');
/** 每局按章节、小节、节点和主公标识去重；新远征重置局内回执。 */
function key(model,node){const m=model.state.meta;return [m.chapter,m.section,node.id,m.lord].join(':');}
/** 使用独立品质抽签，每次必得一件装备，紫装概率不影响技能触发率。 */
function draw(skill,rng){const pool=rng()<skill.purpleChance?skill.purple:skill.blue;return pool[Math.floor(rng()*pool.length)];}
/** 已验证的节点进入事务调用；重复进入只读取回执，失败写盘整体回滚。 */
function enter(model,node){const m=model.state.meta,e=model.state.expedition,skill=config.skills[m.lord];if(!e||!skill||!skill.nodes.includes(node.type)||!model.progression.unlocked(m.lord)||m.hp<=0||model.state.pending)return null;const id=key(model,node),old=e.lordEntryRewards?.[id];if(old)return old;const equipment=draw(skill,random(model.state.seed++));model.addEquipment(equipment);const record={key:id,shown:false,receipt:{lord:m.lord,kind:'equipment',id:equipment,phase:'entry'}};e.lordEntryRewards={...e.lordEntryRewards,[id]:record};return record;}
/** 重载只展示已落盘回执，不因重绘、战斗重试或关闭动画重复发奖。 */
function show(v){if(v.playing||v.startingBattle||v.modal||v.model.state.pending)return;const model=v.model,node=model.progression.nodes().find(n=>n.id===model.state.meta.activeNode);if(!node)return;const record=model.state.expedition.lordEntryRewards?.[key(model,node)];if(!record||record.shown)return;model.transact(()=>{model.state.expedition.lordEntryRewards[record.key].shown=true;});require('./lord-skill-view').show(v,()=>{},record.receipt);}
module.exports={key,draw,enter,show};
