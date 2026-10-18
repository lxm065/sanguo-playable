'use strict';
const c=require('./enemy-reinforcement-config');
/** 关卡身份决定援军数量与武将；不消耗战斗随机数。 */
function seed(state){return Array.from(require('./enemy-budget').key(state)||'').reduce((n,ch)=>(Math.imul(n,31)+ch.charCodeAt(0))>>>0,c.seed);}
/** 按人口内最强合法阵容计算援军等级，场下低级卡不稀释平均等级。 */
function plan(state,rules=require('./config')){const allies=require('./strongest-team').query(state,rules).units;return {count:c.minCount+seed(state)%(c.maxCount-c.minCount+1),star:Math.max(c.minStar,Math.min(c.maxStar,Math.floor(allies.reduce((n,u)=>n+u.star,0)/Math.max(1,allies.length)-c.levelOffset)))};}
/** 在原有难度预算之后追加无装备援军，并统一重排唯一站位。 */
function apply(units,state,rules,roster){if(state.meta.section<c.fromSection||state.pending)return units;const p=plan(state,rules),pool=roster.filter(h=>h.tier<=p.star&&h.tiers?.some(t=>t.star===p.star)),result=units.filter(u=>!u.reinforcement),count=Math.min(p.count,Math.max(0,Math.min(rules.columns*rules.rows,rules.maxDeployedLimit)-result.length));if(!pool.length)return units;let uid=Math.min(0,...result.map(u=>u.uid))-1;for(let i=0;i<count;i++)result.push({uid:uid--,heroId:pool[(seed(state)+i)%pool.length].id,star:p.star,equipment:[],reinforcement:true,...(units[0]?.retryStats?{retryStats:{...units[0].retryStats}}:{}),slot:-1});return require('./enemy-formation').arrange(result,roster,rules);}
module.exports={plan,apply};
