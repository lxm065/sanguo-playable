'use strict';
/** 棋组档位与局内等级分离，避免高档武将升到本体档位时属性反而下降。 */
function create(roster,config){
  return roster.map(hero=>{
    const base=hero.tiers?.find(t=>t.star===hero.tier)||hero;
    const tiers=Array.from({length:config.maxStar},(_,index)=>({...base,star:index+config.initialLevel,
      hp:Math.round(base.hp*Math.pow(config.levelGrowth.hp,index)),
      attack:Math.round(base.attack*Math.pow(config.levelGrowth.attack,index))}));
    return {...hero,tiers};
  });
}
module.exports={create};
