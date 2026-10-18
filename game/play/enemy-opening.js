'use strict';
const c=require('./enemy-opening-config');
/** 从已完成路线统计战斗次数；同节点失败重试不消耗温和开局额度。 */
function index(state){const m=state.meta;if(!m||m.section!==c.section||!m.activeNode)return -1;const nodes=require('./route-graph').nodes(m,require('./classic-config')),node=nodes.find(n=>n.id===m.activeNode);if(!node||!c.types.includes(node.type))return -1;const done=m.route?.key===m.chapter+'-'+m.section?m.route.nodes:[],count=nodes.filter(n=>done.includes(n.id)&&c.types.includes(n.type)).length;return c.encounters===null||count<c.encounters?count:-1;}
/** 查询保护期，不修改路线或随机种子。 */
function active(state){return index(state)>=0;}
/** 装備使用首章第一节的配装门槛，避免后期章开局提前获得完整装备。 */
function reference(state){return {...state,meta:{...state.meta,chapter:c.referenceChapter,section:c.referenceSection}};}
/** 仅迁移保护期敌阵，后续阶段的锁定阵容不受新保护配置影响。 */
function stale(state,encounter){return active(state)&&encounter?.openingPolicyVersion!==c.version;}
/** 优先降低最高等级，无法降级时减员；保留最少一名一级敌人以维持可战斗节点。 */
function reduceLevels(levels){const p=c.levelBudget;let remaining=p.gap;while(remaining>0&&levels.length){levels.sort((a,b)=>b-a);if(levels[0]>p.minStar){levels[0]--;remaining--;}else if(levels.length>p.minCount){remaining-=levels.pop();}else break;}return levels.sort((a,b)=>b-a);}
/** 从人口内最强阵容扣除总等级预算，人数与逐名等级同时不超过玩家。 */
function ceiling(state,rules){const team=require('./strongest-team').query(state,rules).units,levels=team.map(u=>u.star).sort((a,b)=>b-a);levels.length=Math.min(levels.length,rules.columns*rules.rows,rules.maxDeployedLimit);reduceLevels(levels);const count=levels.length,min=Math.min(...levels),max=Math.max(...levels);return {minCount:count,maxCount:count,count,star:count?min:c.star,minStar:count?min:c.star,maxStar:count?max:c.star,levels,promoted:0,progress:0};}
/** 每关以最近实际通关总等级递进，当前玩家阵容只提供上限。 */
function plan(state,rules){const cap=ceiling(state,rules),budget=require('./enemy-opening-progress').budget(state),levels=cap.levels.slice();let total=levels.reduce((n,v)=>n+v,0);while(total>budget&&levels.length){levels.sort((a,b)=>b-a);if(levels[0]>c.levelBudget.minStar){levels[0]--;total--;}else total-=levels.pop();}const count=levels.length,min=count?Math.min(...levels):c.star,max=count?Math.max(...levels):c.star;return {...cap,minCount:count,maxCount:count,count,star:min,minStar:min,maxStar:max,levels:levels.sort((a,b)=>b-a),budget,ceiling:cap.levels.reduce((n,v)=>n+v,0)};}
/** 保护期统一使用不超过玩家的等级分布与人数，保持敌方身份并清除全部装备。 */
function protect(units,state,roster,rules=require('./config')){if(!active(state)||state.pending)return units;const target=plan(state,rules);if(!units.length||!target.count)return [];const result=target.levels.map((star,i)=>({...units[i%units.length],uid:-i-1,star,equipment:[],reinforcement:false}));return require('./enemy-formation').arrange(result,roster,rules);}
module.exports={index,active,reference,stale,ceiling,plan,protect};
