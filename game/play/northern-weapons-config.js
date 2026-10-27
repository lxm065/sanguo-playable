'use strict';
/** 两件北方武将专属的战斗规则；独立于通用装备基础效果。 */
module.exports={
 blade:{id:'7004',hero:'yanliang',name:'河北摧锋',cooldown:10,readyDuration:5,power:1.8,radius:1,halfAngle:60,armorReduction:.2,armorDuration:4,effect:'exclusive-hebei',description:'颜良专属技能【河北摧锋】：主动施法后强化下一次普攻，强化保留5秒，独立冷却10秒；追加前方1格扇形重劈，造成180%攻击力物理伤害，并降低20%护甲，持续4秒，破甲不叠加'},
 bow:{id:'7209',hero:'xiahouyuan',name:'寒羽贯阵',attacks:5,power:1.2,range:5,halfWidth:.45,targets:3,travel:.45,minTravel:.12,slow:.3,duration:2,effect:'exclusive-frost-pierce',description:'夏侯渊专属技能【寒羽贯阵】：每第5次普攻出手追加贯穿寒箭，对射击直线上最多3名敌人各造成120%攻击力物理伤害，并降低30%攻击速度2秒。计数跨目标保留，追加箭不计数、不触发普攻被动；同类减速取较强值'}
};
