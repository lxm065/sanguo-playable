'use strict';
const c=require('./weapon-exclusive-config')['7002'];
/** 结束嗜血仅撤销本效果贡献，保留其他攻速增益和技能冷却。 */
function end(a,t,events){if(!a.dianweiRage||a.dianweiLastStand)return;a.skillHaste-=c.haste;delete a.dianweiRage;events.push({type:'equipment',t,uid:a.uid,target:a.uid,id:'7002',exclusive:true,consume:true});}
/** 友军死亡刷新一次嗜血及完整九秒冷却，不叠加攻速；优先锁定当前目标。 */
function death(dead,units,t,events){
 for(const a of units){if(a.dianweiRage&&(a===dead||a.dianweiRage.target===dead.uid))end(a,t,events);}
 for(const a of units.filter(a=>a!==dead&&!a.dianweiLastStand&&a.hp>0&&a.side===dead.side&&require('./weapon-exclusive').active(a,'7002'))){
  const enemies=units.filter(u=>u.side!==a.side&&require('./combat-protection').targetable(u));
  const target=enemies.find(u=>u.uid===a.exclusiveLastTarget)||enemies.sort((u,v)=>Math.abs(u.x-a.x)+Math.abs(u.y-a.y)-Math.abs(v.x-a.x)-Math.abs(v.y-a.y)||u.uid-v.uid)[0];
  if(!target)continue;if(!a.dianweiRage)a.skillHaste=(a.skillHaste||0)+c.haste;
  a.dianweiRage={until:t+c.duration,target:target.uid};a.nextSkill=t+c.skillCooldown;
  a.nextAction=Math.min(a.nextAction,t+a.interval/(1+a.skillHaste+(a.equipmentHaste||0)));
  events.push({type:'equipment',t,uid:a.uid,target:a.uid,id:'7002',exclusive:true,duration:c.duration});
 }
}
/** 到期或目标失效清理，效果不等待下次普攻才结束。 */
function tick(a,units,t,events){if(!a.dianweiRage||a.dianweiLastStand)return;const expired=t>=a.dianweiRage.until;if(a.hp<=0||expired||!units.some(u=>u.uid===a.dianweiRage.target&&u.hp>0)){if(expired&&a.nextSkill<=t)a.nextAction=Math.min(a.nextAction,t);end(a,t,events);}}
/** 最后奋战借用同一嗜血表现和攻速贡献，覆盖旧嗜血但不重置本体技能冷却。 */
function lastStand(a,t,events,duration){if(!a.dianweiRage)a.skillHaste=(a.skillHaste||0)+c.haste;a.dianweiRage={until:t+duration,target:null};a.nextAction=Math.min(a.nextAction,t+a.interval/(1+a.skillHaste+(a.equipmentHaste||0)));events.push({type:'equipment',t,uid:a.uid,target:a.uid,id:'7002',exclusive:true,duration,lastStand:true});}
module.exports={death,tick,end,lastStand};
