'use strict';
const c=require('./enemy-light-balance-config');
/** 汇总生命、普攻秒伤的静态强度；不运行技能循环，不消耗战斗随机数。 */
function power(units,roster,rules,equipment){const stats=require('./expedition-stats').stats;return units.reduce((sum,u)=>{const s=stats(u,units,roster,equipment,rules);const talent=rules.playerTalent||{},magic=require('./hero-damage').isMagic(s,false),up=(talent[magic?'magicUp':'physicalUp']||0)+(talent.attackUp||0)*(1-c.skillShare)+(talent.skillUp||0)*c.skillShare,down=Math.min(require('./activity-config').talent.damageReductionCap,(talent.physicalDown||0)*(1-c.magicIncomingShare)+(talent.magicDown||0)*c.magicIncomingShare+(talent.attackDown||0)*(1-c.skillShare)+(talent.skillDown||0)*c.skillShare),armor=Math.max(0,(s.armor||0)*(1-c.magicIncomingShare)+(s.magicArmor||0)*c.magicIncomingShare),defense=(1+armor/rules.armorScale)/(1-down);return sum+Math.sqrt(Math.max(1,s.hp)*defense*Math.max(1,s.attack)*(1+up)/Math.max(c.minInterval,s.interval));},0);}
module.exports={power};
