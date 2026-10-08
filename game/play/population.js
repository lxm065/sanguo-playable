'use strict';
const policy=require('./expedition-config'),classic=require('./classic-config');
/** 面板、部署与存档校验共用等级人口曲线；主公加成独立叠加。 */
function limit(state,rules){const level=state.expedition?.level||1+Math.floor(state.wins/rules.limitEveryWins);return Math.min(rules.maxDeployedLimit,policy.baseArmyLimit+(classic.lordArmyBonus[state.meta?.lord||classic.defaultLord]||0)+Math.max(0,level-policy.population.growthOffset));}
/** 旧版多出的上阵单位安全移回备战席，保留武将、装备和待领取战报。 */
function migrate(saved,rules){if(!saved?.expedition||saved.expedition.populationVersion===policy.population.version)return saved;const state=JSON.parse(JSON.stringify(saved)),oldLimit=Math.min(rules.maxDeployedLimit,policy.baseArmyLimit+(classic.lordArmyBonus[state.meta?.lord||classic.defaultLord]||0)+(state.expedition.level||1)-1),deployed=state.units.filter(u=>u.slot>=0);if(deployed.length>oldLimit)return saved;deployed.slice(limit(state,rules)).forEach(u=>u.slot=-1);state.expedition.populationVersion=policy.population.version;return state;}
module.exports={limit,migrate};
