'use strict';
/** 五名本地武将的战斗配置；外观取自同一真三地图，技能为本地规则。 */
module.exports=[
 {id:'zhaoyun',name:'赵云',role:'骁骑',faction:'蜀',hp:650,attack:72,armor:14,range:1,interval:1.25,skillEvery:3,skill:'strike',skillName:'龙胆突刺',skillPower:1.8,description:'每三次攻击触发突刺，对单个敌人造成180%攻击伤害。'},
 {id:'zhangfei',name:'张飞',role:'先锋',faction:'蜀',hp:850,attack:60,armor:24,range:1,interval:1.65,skillEvery:3,skill:'stun',skillName:'当阳怒吼',skillPower:1.2,stunSeconds:1.2,description:'每三次攻击怒吼，对目标造成120%伤害并使其短暂眩晕。'},
 {id:'guanyu',name:'关羽',role:'先锋',faction:'蜀',hp:720,attack:78,armor:18,range:1,interval:1.5,skillEvery:3,skill:'cleave',skillName:'青龙偃月',skillPower:1.3,description:'每三次攻击横扫，对目标及其相邻敌人造成130%攻击伤害。'},
 {id:'huangzhong',name:'黄忠',role:'神射',faction:'蜀',hp:490,attack:82,armor:8,range:4,interval:1.6,skillEvery:3,skill:'strike',skillName:'百步穿杨',skillPower:2.1,description:'射程四格；每三次攻击射出强箭，对目标造成210%攻击伤害。'},
 {id:'zhugeliang',name:'诸葛亮',role:'谋士',faction:'蜀',hp:520,attack:66,armor:9,range:3,interval:1.8,skillEvery:3,skill:'cleave',skillName:'八阵火计',skillPower:1.5,description:'射程三格；每三次攻击施放火计，对目标及相邻敌人造成150%攻击伤害。'},
];
