'use strict';
const c=require('./section-loot-config');
/** 仅在小节结算事务内抽取一次，结果随待领取奖励保存。 */
function prepare(model,reward){if(reward.resetChapter||model.state.meta.chapter<c.fromChapter||model.state.meta.section<c.fromSection)return;const rng=require('./combat').random(model.state.seed++);if(rng()>=c.chance)return;reward.equipmentId=c.pool[Math.floor(rng()*c.pool.length)];}
/** 局内装备只在本章还有后续小节时有效，同时兼容旧档章末奖励。 */
function available(reward){return !!reward.equipmentId&&!reward.resetChapter;}
/** 领取时再次校验，章末旧档不得把局内装备带入下一章。 */
function grant(model,reward){if(available(reward))model.addEquipment(reward.equipmentId);}
/** 局内紫装使用单件领取卡片，避免误标成永久碎片。 */
function show(v,reward){const m=v.overlay(),u=v.ui,item=require('./equipment-theme')[reward.equipmentId],card=v.paper(m,'section-equipment-reward',0,20,620,470);u.text(card,c.title,0,177,40,'#6D4D2C',540,60);u.box(card,'purple-frame',0,30,c.size+10,c.size+10,c.color,false);u.image(card,'equipment/'+reward.equipmentId+'.png',0,30,c.size,c.size);u.text(card,item.name,0,-66,32,c.color,530,50);u.text(card,'额外奖励 · 原有通关奖励随后领取',0,-111,24,'#715330',540,38);require('./benefit-ui').button(v,card,c.accept,0,-177,300,()=>v.act(()=>{const current=v.progress.state.sectionReward;if(!current||current.key!==reward.key)throw Error('奖励已变化');v.model.transact(()=>{current.equipmentPresented=true;});}), 'red');return m;}
module.exports={prepare,grant,show,available};
