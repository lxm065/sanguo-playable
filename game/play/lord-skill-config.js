'use strict';
/** 当前一级主公技能；袁绍概率按用户核对为1/3，蓝装按现有权重池抽取。 */
module.exports={skills:{'1004':{kind:'equipment',trigger:'preparation',chance:1/3,firstGuaranteed:true,guaranteeEvery:3,pool:require('./equipment-pool-config').blue},'1005':{kind:'hero',trigger:'preparation',ranks:[1,2],highChance:.25,firstHighGuaranteed:true}},view:{x:0,y:370,width:630,height:106,iconSize:70,iconX:-257,textX:43,font:25,duration:2.8,fadeSeconds:.3,color:'#FFE2A0',background:'#332719E8'}};

