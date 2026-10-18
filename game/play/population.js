'use strict';
const policy=require('./expedition-config'),classic=require('./classic-config');
/** 同一计算入口支持当前人口规则和历史存档规则，主公加成独立叠加。 */
function capacity(state,rules,curve){
  const level=state.expedition?.level||1+Math.floor(state.wins/rules.limitEveryWins);
  const bonus=classic.lordArmyBonus[state.meta?.lord||classic.defaultLord]||0;
  return Math.min(rules.maxDeployedLimit,curve.base+bonus+Math.max(0,level-curve.growthOffset));
}
/** 面板、部署与存档校验共用等级人口曲线。 */
function limit(state,rules){return capacity(state,rules,{base:policy.baseArmyLimit,growthOffset:policy.population.growthOffset});}
/** 按历史版本校验合法阵容，再将超额单位移回备战席；保留全部资源和待领取战报。 */
function migrate(saved,rules){
  if(!saved?.expedition||saved.expedition.populationVersion===policy.population.version)return saved;
  const curve=policy.population.legacy[saved.expedition.populationVersion||0];
  if(!curve)return saved;
  const deployed=saved.units.filter(u=>u.slot>=0);
  if(deployed.length>capacity(saved,rules,curve))return saved;
  const state=JSON.parse(JSON.stringify(saved));
  state.units.filter(u=>u.slot>=0).slice(limit(state,rules)).forEach(u=>u.slot=-1);
  state.expedition.populationVersion=policy.population.version;
  return state;
}
module.exports={limit,migrate};
