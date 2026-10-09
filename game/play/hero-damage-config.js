'use strict';
/** 三国武将伤害定位；双修共享攻击面板，装备两类攻击加成均计入。 */
module.exports={
 zhangjiao:{magic:true,skillMagic:true,equipmentAttackTypes:['magicAttack']},
 ganning:{magic:false,skillMagic:false,equipmentAttackTypes:['physicalAttack']},
 zhaoyun:{magic:false,skillMagic:true,equipmentAttackTypes:['physicalAttack','magicAttack']},
 zhangliao:{magic:false,skillMagic:true,equipmentAttackTypes:['physicalAttack','magicAttack']},
};
