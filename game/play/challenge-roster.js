'use strict';
/** 按局内等级补齐技能，保留高档棋子入局自带技能，避免低等级丢失。 */
function skillTier(hero,level,config){
 const target=config.skillProgression.keepEntrySkills?Math.max(hero.tier,level):level;
 return [...(hero.tiers||[])].filter(t=>t.star<=target).sort((a,b)=>b.star-a.star)[0]||hero;
}
/** 棋组档位与局内等级分离，避免高档武将升到本体档位时属性反而下降。 */
function create(roster,config){
  return roster.map(hero=>{
    const base=hero.tiers?.find(t=>t.star===hero.tier)||hero;
    const tiers=Array.from({length:config.maxStar},(_,index)=>({...base,star:index+config.initialLevel,
      skills:skillTier(hero,index+config.initialLevel,config).skills,
      hp:Math.round(base.hp*Math.pow(config.levelGrowth.hp,index)),
      attack:Math.round(base.attack*Math.pow(config.levelGrowth.attack,index))}));
    return {...hero,tiers:tiers.map(t=>require('./hero-range').tier(hero.id,t))};
  });
}
module.exports={create,skillTier};
