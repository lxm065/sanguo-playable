'use strict';
const config=require('./weapon-exclusive-config');
/** 仅识别本场真实穿戴且武将匹配的专属装备，同名多件不叠加。 */
function active(a,id){return config[id]?.hero===a.heroId&&a.exclusiveEquipment?.includes(id);}
/** 按目标读取已命中的累计加成；首次攻击及换目标均从零开始。 */
function attackMultiplier(a,u){return active(a,'7008')&&a.exclusiveAim?.target===u.uid?1+a.exclusiveAim.stacks*config['7008'].step:1;}
/** 真实普攻命中才叠层或排队追击，追击走技能命中队列避免递归。 */
function onHit(a,u,t,hits,events,rng){
 if(active(a,'7008'))a.exclusiveAim={target:u.uid,stacks:Math.min(config['7008'].maxStacks,(a.exclusiveAim?.target===u.uid?a.exclusiveAim.stacks:0)+1)};
 const c=config['7208'];if(a.hp>0&&u.hp>0&&active(a,'7208')&&rng()<c.chance){hits.push({at:t+c.delay,a,u,power:c.power,skill:true,critical:false,effect:c.effect,s:{physical:true}});events.push({type:'equipment',t,uid:a.uid,target:u.uid,id:'7208',exclusive:true,duration:c.delay});}
}
/** 击杀排队一次跳劈，落刀位置以死亡格锁定，每次敌方死亡只调度一次。 */
function onKill(a,u,t,hits,events,effect){const c=config['7003'];if(a.hp<=0||a.side===u.side||!active(a,'7003'))return;hits.push({at:t+c.delay,a,exclusiveArea:{x:u.x,y:u.y},power:c.power,skill:true,critical:false,effect:c.effect,s:{trueDamage:true}});events.push({type:'equipment',t,uid:a.uid,target:u.uid,id:'7003',exclusive:true,duration:c.delay});a.nextAction=Math.max(a.nextAction,t+c.delay);}
/** 落刀时读取存活目标，八个周围格共享同一55%攻击系数。 */
function area(hit,units,t){const c=config['7003'];return units.filter(u=>u.hp>0&&u.side!==hit.a.side&&Math.max(Math.abs(u.x-hit.exclusiveArea.x),Math.abs(u.y-hit.exclusiveArea.y))<=c.radius).map(u=>({...hit,u,exclusiveArea:undefined,at:t}));}
/** 开局和施法共用全军强化发放，重复只覆盖为配置倍率。 */
function grantStrategy(a,units,t,events){for(const u of units.filter(u=>u.side===a.side&&u.hp>0)){u.exclusiveStrategy=config['7104'].bonus;events.push({type:'equipment',t,uid:a.uid,target:u.uid,id:'7104',exclusive:true});}}
/** 每场开局两秒独立触发一次，不等待射程或本体主动技能冷却；已阵亡者不发放。 */
function opening(a,units,t,events){require('./frost-luan').opening(a,units,t,events);if(a.hp<=0||a.strategyOpeningDone||!active(a,'7104')||t<config['7104'].openingDelay)return;a.strategyOpeningDone=true;grantStrategy(a,units,t,events);}
/** 一次伤害技能所有弹道/持续段冻结同一倍率；施法结束后再发放新的全军增益。 */
function afterCast(a,units,t,hits,start,events){
 const damageHits=hits.slice(start).filter(h=>h.a===a&&h.skill&&!h.healPower);
 if(a.exclusiveStrategy&&damageHits.length){for(const h of damageHits){h.power*=1+a.exclusiveStrategy;if(h.flatDamage)h.flatDamage*=1+a.exclusiveStrategy;}a.exclusiveStrategy=0;const c=config['7104'];a.exclusiveStrategyHasteUntil=t+c.lingerDuration;require('./hero-skills').buff(a,'exclusive-strategy-haste',{skillHaste:c.lingerHaste},a.exclusiveStrategyHasteUntil);events.push({type:'equipment',t,uid:a.uid,target:a.uid,id:'7104',exclusive:true,consume:true,duration:c.lingerDuration});}
 if(active(a,'7104'))grantStrategy(a,units,t,events);
 require('./mechanism-volley').activate(a,t,hits,events);
 require('./frost-luan').activate(a,units,t,events);
 require('./northern-weapons').afterCast(a,t,events);
}
/** 消耗后的攻速结束时通知图标；若已获新技能强化则继续显示，避免旧到期误删新状态。 */
function tick(a,t,events){require('./northern-weapons').tick(a,t,events);if(a.exclusiveStrategyHasteUntil!==undefined&&t>=a.exclusiveStrategyHasteUntil){delete a.exclusiveStrategyHasteUntil;if(!a.exclusiveStrategy)events.push({type:'equipment',t,uid:a.uid,target:a.uid,id:'7104',exclusive:true,phase:'end'});}}
/** 全场死亡分发给所有存活关羽，击杀来源和追斩来源不影响触发。 */
function onDeath(dead,units,t,hits,events){for(const a of units)onKill(a,dead,t,hits,events);require('./dianwei-exclusive').death(dead,units,t,events);}
module.exports={opening,tick,onDeath,active,attackMultiplier,onHit,onKill,area,afterCast};
