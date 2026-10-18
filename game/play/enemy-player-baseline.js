'use strict';
const c=require('./enemy-light-balance-config').playerBaseline;
/** 新基准从无装备最强阵容取样，装备不参与选人及评分。 */
function sample(model){return require('./strongest-team').query(model.state,model.rules,model.roster,require('./player-combat-context').rules(model),{includeEquipment:c.includeEquipment});}
/** 旧档优先用历史取样阵容去装重算，缺记录时保守取样；迁移只降不升且不清除广告减难。 */
function query(model,cycle){if(!cycle)return sample(model);if(cycle.baselineVersion===c.version)return {power:cycle.baseline};const units=cycle.reference?.units;const value=units?.length?{units,equipment:[],population:cycle.reference.population,power:require('./strongest-team').score(units,model.roster,require('./player-combat-context').rules(model),[])}:sample(model);return {...value,power:Math.min(cycle.baseline,value.power)};}
module.exports={sample,query};
