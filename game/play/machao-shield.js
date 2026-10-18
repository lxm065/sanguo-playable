'use strict';
const id='7007',config=require('./weapon-exclusive-config');
/** 只结束本次蓄能；存活时提前破盾取消蓄能，死亡交由独立结算。 */
function end(a,t,events){if(a.furnaceStarted===undefined)return;delete a.furnaceStarted;events.push({type:'equipment',exclusive:true,id,uid:a.uid,target:a.uid,t,phase:'end'});}
/** 护盾从无到有时开始计时，补充盾量不刷新；耗尽后新盾重新计时。 */
function sync(a,t,events){
 if(a.hp<=0)return;
 if(!require('./weapon-exclusive').active(a,id)||!(a.equipmentShield>0)){end(a,t,events);return;}
 if(a.furnaceStarted!==undefined)return;
 a.furnaceStarted=t;events.push({type:'equipment',exclusive:true,id,uid:a.uid,target:a.uid,t,phase:'charge',duration:config[id].delay});
}
/** 预判现有盾抵扣后的生命，低血或致命伤前补盾；补盾不重置原蓄能。 */
function emergency(a,amount,t,events){
 const c=config[id].emergency;if(a.hp<=0||!require('./weapon-exclusive').active(a,id)||t<(a.furnaceEmergencyNext||0))return;
 const remaining=a.hp-Math.max(0,amount-(a.equipmentShield||0));
 if(a.hp>=a.maxHp*c.threshold&&remaining>=a.maxHp*c.threshold)return;
 const cap=a.maxHp*require('./equipment-effect-config')[id].shieldCap,before=a.equipmentShield||0;
 a.equipmentShield=Math.min(cap,before+a.maxHp*c.shieldRatio);if(a.equipmentShield<=before)return;
 a.furnaceEmergencyNext=t+c.cooldown;events.push({type:'gain',t,target:a.uid,text:'保命护盾',effect:'shield'});sync(a,t,events);
}
/** 消费蓄能后逐目标结算；死亡引爆沿用同一数值与当前位置，不产生重复爆炸。 */
function explode(a,units,t,events,damage,rules){
 const c=config[id];delete a.furnaceStarted;a.equipmentShield=0;
 events.push({type:'equipment',exclusive:true,id,uid:a.uid,target:a.uid,t,phase:'explode',duration:c.visual.explodeDuration});
 const targets=units.filter(u=>u.side!==a.side&&require('./combat-protection').targetable(u)&&Math.max(Math.abs(u.x-a.x),Math.abs(u.y-a.y))<=c.radius);
 for(const u of targets){const health=c.healthSource==='target'?u.maxHp:a.maxHp,armor=c.damageType==='true'?0:c.damageType==='magic'?u.magicArmor-(a.magicPen||0):u.armor;
  const amount=health*c.healthRatio*rules.armorScale/(rules.armorScale+Math.max(require('./expedition-config').localCombat.armorFloor,armor||0));
  damage(a,u,amount,t,true,false,false,c.effect,c.damageType);
 }
}
/** 蓄能期间死亡立即引爆，包含同一击击穿盾并致死的情况。 */
function death(a,units,t,events,damage,rules){if(a.furnaceStarted!==undefined&&require('./weapon-exclusive').active(a,id))explode(a,units,t,events,damage,rules);}
/** 生存状态每帧检查低血补盾，正常蓄能到期再引爆；魅惑延后主动引爆。 */
function tick(a,units,t,events,damage,rules){
 if(a.hp<=0)return;emergency(a,0,t,events);sync(a,t,events);const c=config[id];
 if(a.furnaceStarted===undefined||t<a.furnaceStarted+c.delay||require('./charm-exclusive').active(a,t))return;
 explode(a,units,t,events,damage,rules);
}
module.exports={sync,tick,end,emergency,death};
