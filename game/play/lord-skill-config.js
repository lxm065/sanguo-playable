'use strict';
/** 曹操权重由用户确认；高级首抽保底尚未设定，用null与明确禁用区分。 */
const recruitmentLevels={1:{ranks:[1,2],weights:[75,25],firstHighGuaranteed:true},2:{ranks:[1,2,3],weights:[70,25,5],firstHighGuaranteed:null},3:{ranks:[1,2,3,4],weights:[60,25,10,5],firstHighGuaranteed:null}};
/** 一级保持既有规则，技能升级读取独立等级配置，不借用局内主公等级。 */
module.exports={skills:{'1004':{kind:'equipment',trigger:'preparation',chance:1/3,firstGuaranteed:true,guaranteeEvery:3,pool:require('./equipment-pool-config').blue},'1005':{kind:'hero',trigger:'preparation',...recruitmentLevels[1],levels:recruitmentLevels}},view:{x:0,y:370,width:630,height:106,iconSize:70,iconX:-257,textX:43,font:25,duration:2.8,fadeSeconds:.3,color:'#FFE2A0',background:'#332719E8'}};
