'use strict';
const c=require('./enemy-reinforcement-config');
/** 关卡身份决定援军数量与武将；不消耗战斗随机数。 */
function seed(state){return Array.from(require('./enemy-budget').key(state)||'').reduce((n,ch)=>(Math.imul(n,31)+ch.charCodeAt(0))>>>0,c.seed);}
/** 按实际出战队伍计算等级，空阵以全部候选预览。 */
function plan(state){const team=state.units.filter(u=>u.slot>=0),allies=team.length?team:state.units;return {count:c.minCount+seed(state)%(c.maxCount-c.minCount+1),star:Math.max(c.minStar,Math.min(c.maxStar,Math.floor(allies.reduce((n,u)=>n+u.star,0)/Math.max(1,allies.length)-c.levelOffset)))};}
/** 在原有难度预算之后追加无装备援军，并统一重排唯一站位。 */
function apply(units,state,rules,roster){if(state.meta.section<c.fromSection||state.pending)return units;const p=plan(state),pool=roster.filter(h=>h.tier<=p.star&&h.tiers?.some(t=>t.star===p.star)),result=units.filter(u=>!u.reinforcement),count=Math.min(p.count,Math.max(0,Math.min(rules.columns*rules.rows,rules.maxDeployedLimit)-result.length));if(!pool.length)return units;let uid=Math.min(0,...result.map(u=>u.uid))-1;for(let i=0;i<count;i++)result.push({uid:uid--,heroId:pool[(seed(state)+i)%pool.length].id,star:p.star,equipment:[],reinforcement:true,...(units[0]?.retryStats?{retryStats:{...units[0].retryStats}}:{}),slot:-1});return require('./enemy-formation').arrange(result,roster,rules);}
module.exports={plan,apply};
