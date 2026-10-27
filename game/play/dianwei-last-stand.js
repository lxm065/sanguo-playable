'use strict';
const c=require('./hero-skill-config')['11054'],rage=require('./dianwei-exclusive');
/** 致命伤拦截发生在护盾吸收之后，四阶本体技能每场仅触发一次。 */
function intercept(source,a,amount,t,events){if(a.hp<=0||amount<a.hp||a.lastStandUsed||!(a.skills||[]).some(s=>s.id==='11054'))return amount;
 a.lastStandUsed=true;a.dianweiLastStand={until:t+c.duration,source:source.uid};rage.lastStand(a,t,events,c.duration);return Math.max(0,a.hp-c.minimumHp);}
/** 最后奋战保留可选中与正常行动资格，但统一免疫所有伤害。 */
function invulnerable(a,t){return a.hp>0&&a.dianweiLastStand?.until>t;}
/** 三秒结束无条件走统一死亡入口，治疗和额外友军阵亡都不能续期。 */
function tick(a,t,die){const state=a.dianweiLastStand;if(!state||t<state.until)return;delete a.dianweiLastStand;if(a.hp>0)die(a,state.source,t);}
module.exports={intercept,invulnerable,tick};
