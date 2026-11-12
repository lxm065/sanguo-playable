'use strict';
const config=require('./enemy-mechanism-budget-config');
/** 查询已实现技能的治疗与控制成本，单技能取最大项避免冰冻等重复计费。 */
function skillCost(stat){const skills=require('./hero-skills');if(!skills.managed(stat))return 0;return skills.entries(stat).reduce((total,{rule})=>total+Math.max(config.skills.kinds[rule.kind]||0,rule.pull?config.skills.pull:0,rule.stun?config.skills.stun:0,rule.kind==='damage'&&rule.power>=config.skills.burst.minPower?config.skills.burst.premium:0),0);}
/** 按实际敌阵属性估算回血、格挡及技能溢价，不预演战斗、不读取玩家装备。 */
function query(units,roster,rules,equipment){
 if(!config.enabled||!units.length)return {factor:1,regen:0,block:0,skills:0};
 const context=require('./stat-evaluation-cache').create({...rules,playerTalent:{},playerTalentTree:{},playerEquipmentGrades:{},playerVip:null,playerBonds:undefined});
 const stats=units.map(u=>require('./expedition-stats').stats(u,units,roster,equipment,context)),hp=stats.reduce((sum,s)=>sum+s.hp,0),attack=stats.reduce((sum,s)=>sum+s.attack,0)/stats.length;
 const regen=Math.min(config.regen.maxPremium,stats.reduce((sum,s)=>sum+(s.regen||0)+(s.regenPercent||0)*s.hp,0)*config.regen.seconds/Math.max(1,hp)*config.regen.weight);
 const block=Math.min(config.block.maxPremium,stats.reduce((sum,s)=>sum+(s.block||0),0)/stats.length/Math.max(1,attack)*config.block.weight);
 const skills=Math.min(config.skills.maxPremium,stats.reduce((sum,s,i)=>sum+skillCost({...s,heroId:units[i].heroId}),0));
 return {factor:1+Math.min(config.maxPremium,regen+block+skills),regen,block,skills};
}
module.exports={query};
