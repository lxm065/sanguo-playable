'use strict';
/** 青釭剑专属规则集中配置；每段为一次物理技能攻击，基础破甲独立保留。 */
module.exports={id:'7001',hero:'zhaoyun',name:'七进七出',initialCooldown:0,cooldown:12,hits:7,interval:.2,power:1,moveSeconds:.1,effect:'qinggangSlash',slashAsset:'bladeSweep',slashFrames:[0,1,2,3,4,5],slashDuration:.24,slashColor:'#E5F5FF',slashWidth:1.4,slashHeight:1,attackAnimation:'skill1',attackStartProgress:.25,slashLabels:['一斩','二斩','三斩','四斩','五斩','六斩','七斩'],trailAsset:'spark',trailColor:'#9FEAFF',trailSize:90,slashSize:150,offsetY:40,
 description:'赵云专属技能【七进七出】：在敌人之间高速来回穿梭，随机斩击七次；斩击期间无敌且无法被选中。'};
