'use strict';
const config=require('./weapon-exclusive-config'),{distance}=require('./combat'),protection=require('./combat-protection');
const id='7101';
/** 临时控制不修改永久阵营，胜负、奖励及羁绊仍按原阵营结算。 */
function active(unit,t){return unit.hp>0&&unit.charmedUntil>t;}
/** 控制期间只攻击原阵营的其他单位，禁止自伤或攻击施法方。 */
function hostile(actor,target,t){return actor!==target&&(active(actor,t)?actor.side===target.side:actor.side!==target.side);}
/** 统一结束控制并通知表现层回收状态。 */
function tick(unit,t,events){if(unit.charmedUntil!==undefined&&(!active(unit,t))){events.push({type:'equipment',exclusive:true,id,t,uid:unit.charmSource,target:unit.uid,phase:'end'});delete unit.charmedUntil;unit.nextAction=Math.min(unit.nextAction,t);}}
/** 在攻击距离内选取最近敌将；冷却和首次触发由装备配置驱动。 */
function activate(actor,units,t,hits,events){
 const c=config[id];if(!require('./weapon-exclusive').active(actor,id)||active(actor,t)||actor.silencedUntil>t||t<(actor.nextCharm??c.initialCooldown))return false;
 const target=units.filter(u=>hostile(actor,u,t)&&!u.summoned&&!u.negativeImmune&&protection.targetable(u)&&!active(u,t)&&distance(actor,u)<=actor.range).sort((a,b)=>distance(actor,a)-distance(actor,b)||a.uid-b.uid)[0];
 if(!target)return false;
 actor.nextCharm=t+c.cooldown;actor.nextAction=t+c.travel;
 hits.push({at:t+c.travel,a:actor,u:target,charm:true});
 events.push({type:'equipment',exclusive:true,id,t,uid:actor.uid,target:target.uid,phase:'launch',duration:c.travel});return true;
}
/** 命中才开始四秒控制，同时打断旧动作；已飞出的旧阵营攻击不再生效。 */
function impact(hit,t,events,hits=[]){
 const {a,u}=hit;if(u.negativeImmune||a.hp<=0||!protection.targetable(u)||u.summoned||a.side===u.side||active(a,t))return;
 for(const pending of hits)if(pending.a===u&&!pending.healPower)pending.cancelled=true;
 u.charmedUntil=t+config[id].duration;u.charmSource=a.uid;u.charmEpoch=(u.charmEpoch||0)+1;u.channelUntil=t;u.channelInterruptedAt=t;u.nextAction=t;
 events.push({type:'equipment',exclusive:true,id,t,uid:a.uid,target:u.uid,phase:'impact',duration:config[id].duration});
}
/** 校验攻击发出和落地时的控制状态，防止跨控制边界的旧弹道伤害。 */
function validHit(hit,t){if(hit.cancelled)return false;if(hit.healPower)return true;if(hit.charmAttack)return active(hit.a,t)&&hit.charmEpoch===hit.a.charmEpoch&&hostile(hit.a,hit.u,t);return !active(hit.a,t);}
module.exports={active,hostile,tick,activate,impact,validHit};
