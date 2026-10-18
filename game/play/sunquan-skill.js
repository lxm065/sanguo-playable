'use strict';
const c=require('./sunquan-skill-config'),{random}=require('./combat');
/** 仅匹配已配置技能等级，局内等级和合成阶级不参与技能等级判定。 */
function rule(m){return m.state.meta?.lord===c.lord?c.levels[m.state.meta.lordSkillLevels?.[c.lord]||1]:null;}
/** 使用存档种子独立判定，每次有效操作只抽一次，失败事务会回滚种子。 */
function hit(m,chance){return Number.isFinite(chance)&&random(m.state.seed++)()<chance;}
/** 回执与属性变化同事务保存，视图只在本次成功操作后读取。 */
function receipt(m,data){const e=m.state.expedition;e.sunquanSkill={sequence:(e.sunquanSkill?.sequence||0)+1,lord:c.lord,...data};return e.sunquanSkill;}
/** 合成已经腾出材料位置，返还原材料的新实例，不复制装备或上阵位置。 */
function merge(m,material){const r=rule(m);if(!r||!hit(m,r.mergeReturnChance))return null;const u={uid:m.state.nextUid++,heroId:material.heroId,star:material.star,slot:-1};m.state.units.push(u);return receipt(m,{kind:'hero',source:'merge',id:u.heroId,star:u.star,uid:u.uid});}
/** 正常泉水升级后重建合法池，只额外执行一次，不递归触发技能或合成返还。 */
function spring(m,event){const r=rule(m);if(!r||!hit(m,r.springUpgradeChance))return null;const policy=require('./node-event-config').spring,limit=Math.min(policy.upgradeMax,m.maxRank()-1),pool=m.state.units.filter(u=>u.star<=limit&&(c.allowSameSpringTarget||u.uid!==event.result.uid));if(!pool.length)return null;const u=pool[Math.floor(random(m.state.seed++)()*pool.length)];u.star++;if(u.star===require('./war-order-config').star)m.activities?.record('merge4');event.extraResult={kind:'upgrade',heroId:u.heroId,star:u.star,uid:u.uid};return receipt(m,{kind:'announcement',source:'spring',eventKey:event.key,result:event.extraResult});}
module.exports={rule,hit,merge,spring};
