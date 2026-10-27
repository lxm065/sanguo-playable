'use strict';
/** 祝融远程火刃规则；保留原技能倍率、冷却和控制强度，范围中心改为敌方目标。 */
module.exports={
 '14211':{kind:'damage',power:2.5,physical:true,armorBreak:20,duration:4,effect:'fireBlade',description:'向射程内敌人投掷破甲火刃，造成250%攻击力物理伤害，降低20点物理防御，持续4秒。'},
 '14212':{kind:'fortitude',armor:30,magicArmor:30,effect:'vineArmor',description:'藤甲护身：永久增加自身30点物理防御和30点魔法防御（被动）。'},
 '14213':{kind:'damage',power:1,physical:true,radius:1,attackWeaken:.6,duration:5,effect:'returningBlade',description:'向射程内敌人投出回旋火刃，对目标及其周围1格敌人造成100%攻击力物理伤害，降低60%基础攻击力，持续5秒。同类削弱刷新不叠加，回程不重复伤害。'},
 '14214':{kind:'damage',power:1,physical:true,radius:3,stun:5,effect:'blazingVolley',description:'向射程内敌人所在区域齐射火刃，对目标及其周围3格敌人造成100%攻击力物理伤害，并眩晕5秒。'}
};
