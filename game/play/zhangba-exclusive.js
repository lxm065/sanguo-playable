"use strict";
const c=require('./weapon-exclusive-config')['7005'];
/** 擒敌命中且目标存活后触发；拉拽表现完成再开始连刺，不复制装备实例。 */
function afterHit(a,u,hit,t,hits,events,rules){
 if(!require('./weapon-exclusive').active(a,'7005')||hit.skillId!==c.triggerSkill||!hit.s.pull||a.hp<=0||u.hp<=0||a.side===u.side||u.summoned)return false;
 u.stunnedUntil=Math.max(u.stunnedUntil||0,t+require("./enemy-relief").duration(a,c.stun));
 events.push({type:'status',t,target:u.uid,effect:'stun',duration:require("./enemy-relief").duration(a,c.stun)});
 const delay=Math.max(rules.moveSeconds,c.interval),end=t+delay+(c.count-1)*c.interval;
 a.channelUntil=Math.max(a.channelUntil||0,end);a.nextAction=Math.max(a.nextAction||0,end);
 for(let i=0;i<c.count;i++)hits.push({at:t+delay+i*c.interval,a,u,power:c.power,skill:true,critical:false,effect:c.effect,slashIndex:i+1,channel:true,channelStart:t,s:{trueDamage:true}});
 return true;
}
/** 仅对通过死亡、保护及打断校验的连刺发送攻击动作，事件与命中一一对应。 */
function beforeHit(hit,t,events){if(hit.effect!==c.effect)return;events.push({type:'equipment',t,uid:hit.a.uid,target:hit.u.uid,id:'7005',exclusive:true,index:hit.slashIndex,duration:c.interval});}
module.exports={afterHit,beforeHit};
