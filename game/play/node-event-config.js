'use strict';
/** 截图可确认的价格、数量与选项；未取得原服权重的商品池使用现有已实现装备。 */
module.exports={types:['merchant','treasure','spring'],
 backgrounds:{merchant:'classic/event-merchant.png',treasure:'classic/event-treasure.png',spring:'classic/event-spring.png'},
 titles:{merchant:'神秘商店',treasure:'地下宝藏',spring:'生命之泉'},
 merchant:{caption:{centerY:0,y:-42,width:205,height:38,font:24,color:'#674322',reward:'{amount}金币'},advanced:{fromChapter:3,chance:.3,heroRanks:[1,1,1,2,2,2]},heroRanks:[1,1,1,1,2,2],heroPrices:{1:67,2:200},bluePool:require('./equipment-pool-config').blue,purplePool:require('./equipment-pool-config').purple,blueCount:2,purpleCount:2,bluePrice:300,purplePrice:1000,experiencePrice:200,experience:200,adGold:500,sellRatio:.5},
 treasure:{purple:{fromChapter:4,chance:.2,pool:require('./equipment-pool-config').purple},count:3,pool:require('./equipment-pool-config').blue},
 spring:{copyMax:4,upgradeMax:3,pool:require('./equipment-pool-config').blue,options:[{id:'equipment',title:'随机获得1件\n装备',icon:'classic/spring-equipment.png'},{id:'copy',title:'随机复制一个\n1–4阶单位',icon:'classic/spring-copy.png'},{id:'upgrade',title:'随机合成一个\n1–3阶单位',icon:'classic/spring-upgrade.png'}]},
 layout:{titleY:390,columns:3,cardX:230,shopTop:287,shopRow:130,shopWidth:217,shopHeight:128,choiceY:70,choiceWidth:218,choiceHeight:380,portrait:105,icon:82,buttonY:-73,choiceButtonY:-120,sellY:-215,sellWidth:685,sellHeight:86,reserveY:-350,reserveSlots:6,reserveSpacing:110,adY:-200,targetY:50,targetGap:170},
 colors:{merchant:'#183323C0',treasure:'#0C253CDA',spring:'#182B69C8'},
};
