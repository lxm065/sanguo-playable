'use strict';
/** 数值沿用原表；未知服务端叠加顺序、广告资格与页序集中为本地适配策略。 */
module.exports={tabs:['力量','敏捷','智力'],shopSlots:2,unlockLevel:1,adsPerPoint:2,claimsPerLevel:1,
 prerequisites:[[],[],[],[0],[1],[2],[3,4],[4,5],[6],[6,7],[7],[8],[9],[10],[11],[12],[13]],
 positions:[[-210,0],[0,0],[210,0],[-210,1],[0,1],[210,1],[-110,2],[110,2],[-210,3],[0,3],[210,3],[-210,4],[0,4],[210,4],[-210,5],[0,5],[210,5]],
 combat:{columns:6,controlSeconds:1,stackMax:10,strengthSeconds:3,agilitySeconds:3,intelligenceSeconds:5,attackCooldownUnit:.1,frontRow:2,middleRow:1,backRow:0,maxDodge:.9,maxReduction:.9},
 shopLayout:{x:225,y:370,width:230,height:56,cardWidth:610,cardHeight:470,offerX:150,icon:100,font:26},
 layout:{width:680,height:1080,titleY:493,viewportY:35,viewportHeight:740,viewportWidth:620,top:260,rowGap:160,icon:82,font:25,tabY:-387,buttonY:-478,buttonWidth:265,buttonHeight:80,dragThreshold:14,locked:'#757575',ready:'#79DE35',paper:'#E5D2AA',ink:'#593E2C',line:'#B4B3A8'},
 text:{title:'天赋点：',get:'获取天赋点',reset:'重置天赋点',resetBody:'重置全部三系加点，退回已消耗的天赋点和钻石。',source:'节点数值、费用和前置条件来自原版客户端配置；广告领取额度与战斗叠加采用本地适配。'}};
