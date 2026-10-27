'use strict';
const c=require('./frost-luan-config');
/** 对护盾目标发出阶段事件，施法者只用于飞行起点和伤害归属。 */
function event(u,s,t,events,phase){events.push({type:'equipment',exclusive:true,id:c.id,uid:s.source,target:u.uid,t,phase,duration:c.duration});}
/** 每次真实主动施法检查一次；初始可用，固定冷却从发盾时起算。 */
function activate(a,units,t,events){
 if(a.hp<=0||!require('./weapon-exclusive').active(a,c.id)||t<(a.frostLuanNext||0))return;
 const u=units.filter(u=>u.hp>0&&u.side===a.side).sort((x,y)=>x.hp/x.maxHp-y.hp/y.maxHp||x.uid-y.uid)[0];if(!u)return;
 const previous=u.frostLuanShield,remaining=Math.round(u.maxHp*c.shieldRatio);a.frostLuanNext=t+c.cooldown;
 if(previous&&previous.until>t&&previous.remaining>remaining)return;
 u.frostLuanShield={remaining,until:t+c.duration,source:a.uid,side:a.side,attack:a.attack,magicPen:a.magicPen||0};event(u,u.frostLuanShield,t,events,'shield');
}
/** 每场开局两秒检查一次，复用实际发盾路径及冷却，提前已触发则不重复发盾。 */
function opening(a,units,t,events){if(a.hp<=0||a.frostLuanOpeningDone||!require('./weapon-exclusive').active(a,c.id)||t<c.openingDelay)return;a.frostLuanOpeningDone=true;activate(a,units,t,events);}
/** 到期或目标阵亡仅移除本盾层，不引爆；施法者阵亡不提前取消已发出的保护。 */
function expire(u,t,events){const s=u.frostLuanShield;if(s&&(u.hp<=0||t>=s.until)){delete u.frostLuanShield;event(u,s,t,events,'end');}}
/** 优先吸收伤害，破盾先消费状态再返回凭据，避免反击递归重复引爆。 */
function absorb(u,amount,t,events){expire(u,t,events);const s=u.frostLuanShield;if(!s||amount<=0)return {amount};const used=Math.min(amount,s.remaining);s.remaining-=used;events.push({type:'shield',t,target:u.uid,amount:used});if(s.remaining>0)return {amount:amount-used};delete u.frostLuanShield;return {amount:amount-used,broken:s};}
/** 护盾受击破裂后在保护者当前格反击，使用发盾时小乔攻击和法穿快照。 */
function explode(u,s,units,t,events,damage,rules){
 if(!s)return;event(u,s,t,events,'burst');const original=units.find(a=>a.uid===s.source);if(!original)return;
 const a=original;
 for(const enemy of units.filter(x=>x.side!==s.side&&require('./combat-protection').targetable(x)&&!require('./xuchu-survival').invulnerable(x,t)&&Math.max(Math.abs(x.x-u.x),Math.abs(x.y-u.y))<=c.radius)){
  const armor=Math.max(require('./expedition-config').localCombat.armorFloor,(enemy.magicArmor||0)-s.magicPen);
  damage(a,enemy,s.attack*c.power*rules.armorScale/(rules.armorScale+armor),t,true,false,false,c.effect,'magic');
  if(enemy.hp<=0||enemy.negativeImmune)continue;const duration=require('./enemy-relief').duration(a,c.slowDuration);
  enemy.equipmentSlow=Math.max(enemy.equipmentSlowUntil>t?enemy.equipmentSlow||0:0,c.slow);enemy.equipmentSlowUntil=Math.max(enemy.equipmentSlowUntil||0,t+duration);
  events.push({type:'status',t,target:enemy.uid,effect:'slow',duration});
 }
}
module.exports={activate,opening,expire,absorb,explode};
