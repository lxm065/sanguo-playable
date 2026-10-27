'use strict';
/** 待机资格：存活受伤、非持续施法或抛飞，未被本屏保护；不打断正在引导的友军。 */
function target(a,units,t){return units.filter(u=>u.side===a.side&&u.hp>0&&u.hp<u.maxHp&&!(u.channelUntil>t)&&!(u.tossedUntil>t)&&!(u.frostScreenUntil>t)&&!require('./combat-protection').protectedUnit(u)).sort((x,y)=>(y.maxHp-y.hp)-(x.maxHp-x.hp)||x.uid-y.uid)[0];}
/** 独立护屏状态限制行动，护甲与恢复队列共用原战斗结算，避免误用无敌盾。 */
function cast(a,u,s,t,hits,events,skillId){if(!u)return;const until=t+s.duration;u.frostScreenUntil=until;require('./hero-skills').buff(u,'frost-screen',{armor:s.armor},until);for(let elapsed=s.period;elapsed<=s.duration;elapsed+=s.period)hits.push({at:t+elapsed,a,u,frostScreenHeal:true,until,ratio:s.healRatio});events.push({type:'status',t,target:u.uid,effect:s.effect,skillId,duration:s.duration});}
/** 已生成的凝霜屏不因施法者死亡取消；不复活，旧屏治疗不能重复作用于新屏。 */
function healTick(hit,t,heal){if(hit.u.hp>0&&hit.u.frostScreenUntil===hit.until&&t<=hit.until+1e-8)heal(hit.u,hit.u.maxHp*hit.ratio,t);}
module.exports={target,cast,healTick};
