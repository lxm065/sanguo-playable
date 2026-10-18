'use strict';
/** 从已确认的技能等级读取招募范围和权重；旧档默认一级，不随上阵等级升级。 */
function forLevel(skill,level=1){if(!skill.levels)return skill;const entry=skill.levels[level];if(!entry)throw Error('未配置主公技能等级');return {...skill,...entry};}
/** 高阶优先累加保持一级旧随机区间；不可用等级移除后按剩余权重归一化。 */
function weighted(skill,ranks,rng){const entries=skill.ranks.map((rank,i)=>({rank,weight:skill.weights[i]})).filter(e=>ranks.includes(e.rank));if(!entries.length||entries.some(e=>!Number.isFinite(e.weight)||e.weight<0))throw Error('主公招募权重配置无效');const total=entries.reduce((sum,e)=>sum+e.weight,0);if(total<=0)throw Error('主公招募权重必须大于零');let value=rng()*total;for(const entry of entries.slice().reverse()){value-=entry.weight;if(value<0)return entry.rank;}return entries[0].rank;}
/** 只使用明确配置的首抽保底；高级保底为待定，不继承一级规则。 */
function pick(model,lord,skill,ranks,rng){const first=!model.state.expedition.lordSkillActivated?.[lord];let rank;if(first&&skill.firstHighGuaranteed===true){const preferred=Math.max(...skill.ranks);rank=ranks.includes(preferred)?preferred:ranks[0];}else if(skill.weights)rank=weighted(skill,ranks,rng);else{const preferred=rng()<skill.highChance?Math.max(...skill.ranks):Math.min(...skill.ranks);rank=ranks.includes(preferred)?preferred:ranks[0];}model.state.expedition.lordSkillActivated={...model.state.expedition.lordSkillActivated,[lord]:true};return rank;}
module.exports={pick,weighted,forLevel};
