'use strict';
const c=require('./hero-skill-config'),{distance}=require('./combat');
/** 只读取当前阶级真实解锁的规则。 */
function rule(a,kind){return (a.skills||[]).map(s=>c[s.id]).find(s=>s?.kind===kind);}
/** 被动护甲和异常免疫在战斗快照中初始化一次。 */
function initialize(a){const iron=rule(a,'ironBody');if(iron)a.armor+=iron.armor;a.negativeImmune=!!rule(a,'lastStand');}
/** 风沙与吟唱伤害使用到点重选范围的任务，不锁定施法时的敌人。 */
function cast(a,skill,t,hits,events,rules){const s=skill.rule;if(!['sandstorm','epicenter'].includes(s.kind))return false;
 if(s.kind==='sandstorm'){a.invisibleUntil=t+s.invisible;events.push({type:'status',t,target:a.uid,effect:'sandVeil',duration:s.invisible});for(let n=1;n<=Math.round(s.duration/s.period);n++)hits.push({at:t+n*s.period,a,warriorArea:true,skill:true,power:s.power,skillId:skill.id,s});}
 else{const delay=s.windup/(1+(a.marchCast||0));a.channelUntil=t+delay;hits.push({at:t+delay,a,warriorArea:true,skill:true,power:s.power,skillId:skill.id,s,channel:true,channelStart:t});}return true;}
/** 持续风沙随人移动；吟唱被控制或施法者死亡后不产生冲击。 */
function area(hit,units,t,events){const {a,s}=hit;if(a.hp<=0||require('./charm-exclusive').active(a,t)||(hit.channel&&(a.stunnedUntil>t||a.silencedUntil>t||a.channelInterruptedAt>=hit.channelStart)))return [];
 events.push({type:'ability',t,uid:a.uid,target:a.uid,effect:s.kind==='sandstorm'?'sandPulse':'earthPulse',skillId:hit.skillId,impactOnly:true});
 return units.filter(u=>u.hp>0&&u.side!==a.side&&!require('./combat-protection').protectedUnit(u)&&distance(a,u)<=s.radius).map(u=>({at:t,a,u,skill:true,critical:false,power:hit.power,skillId:hit.skillId,effect:s.effect,s}));}
/** 命中前挂感染，保证附带感染的致命普攻也能引爆；同来源刷新不叠层。 */
function beforeHit(hit,t,events){const {a,u}=hit,s=rule(a,'bonus');if(hit.skill||hit.charmAttack||!s?.infectionDuration||u.negativeImmune||require('./xuchu-survival').invulnerable(u,t))return;u.infections=u.infections||{};u.infections[a.uid]={source:a,until:t+s.infectionDuration,attack:a.attack,rule:s};events.push({type:'status',t,target:u.uid,effect:'infection',skillId:'13153',duration:s.infectionDuration});}
/** 铁躯只反击近身普通攻击，不反击技能或其他反击，反击按物理护甲结算。 */
function counter(hit,t,hits,events,rng){const {a,u}=hit,s=rule(u,'ironBody');if(!s||hit.skill||a.hp<=0||u.hp<=0||require('./charm-exclusive').active(u,t)||distance(a,u)>s.radius||rng()>=s.chance)return;
 hits.push({at:t,a:u,u:a,skill:true,critical:false,power:s.power,effect:s.effect,s:{stun:s.stun}});events.push({type:'ability',t,uid:u.uid,target:a.uid,effect:s.effect,skillId:'11052'});}
/** 感染死亡爆炸排队而非递归，每次死亡清除感染以免重复引爆。 */
function onDeath(dead,units,t,hits,events,rules){for(const infection of Object.values(dead.infections||{})){if(infection.until<=t)continue;const {source:a,attack,rule:s}=infection;events.push({type:'ability',t,uid:dead.uid,target:dead.uid,effect:'infectionBurst',impactOnly:true});for(const u of units.filter(u=>u.hp>0&&u.side!==a.side&&distance(dead,u)<=s.radius))hits.push({at:t,a,u,skill:true,critical:false,baseDamage:attack*s.deathPower,effect:'infectionBurst',s:{}});}delete dead.infections;}
module.exports={initialize,cast,area,beforeHit,counter,onDeath};
