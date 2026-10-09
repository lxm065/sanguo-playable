'use strict';
/** 首次保证高阶，之后按配置概率抽取；只在发奖事务内更新首次标记。 */
function pick(model,lord,skill,ranks,rng){const first=!model.state.expedition.lordSkillActivated?.[lord];const preferred=(first&&skill.firstHighGuaranteed)||rng()<skill.highChance?Math.max(...skill.ranks):Math.min(...skill.ranks);const rank=ranks.includes(preferred)?preferred:ranks[0];model.state.expedition.lordSkillActivated={...model.state.expedition.lordSkillActivated,[lord]:true};return rank;}
module.exports={pick};
