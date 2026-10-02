'use strict';
/** 本地可玩版规则与布局；未取得原服务端算法的项目均采用明确的本地配置。 */
module.exports={
 version:2,storageKey:'sanguo.classic.v3.player',storageBackupKey:'sanguo.classic.v3.player.backup',
 leaderHero:'zhaoyun',trainingHero:'guanyu',
 title:'三国自走棋',chapterNames:['黄巾之乱','虎牢关战','群雄逐鹿'],stagesPerChapter:8,
 startingGold:0,startingSeed:1847,startingRoster:['zhaoyun','zhaoyun','zhaoyun'],
 initialDeployment:[],capacity:12,columns:6,rows:3,
 baseDeployedLimit:2,maxDeployedLimit:6,limitEveryWins:3,mergeCount:3,maxStar:3,hpGrowth:1.8,attackGrowth:1.5,
 recruitCost:100,refreshCost:30,shopSize:3,sellRatio:0.5,winGold:100,lossGold:30,rewardChoices:3,
 enemyStartCount:1,enemyEveryStages:2,enemyBaseScale:0.7,enemyGrowth:0.05,enemyMaxScale:2.2,
 enemyColumns:[2,3,1,4,0,5],
 tickSeconds:0.1,attackDelay:0.35,moveSeconds:0.3,maxBattleSeconds:90,armorScale:100,minDamage:1,
 criticalChance:0.08,criticalMultiplier:1.5,synergyThreshold:2,synergyAttackBonus:0.1,
 assetsRoot:'skin-assets/',battleImage:'battle-ground.png',mapImage:'campaign-map.png',
 colors:{ink:'#2D261F',paper:'#EAD8AF',gold:'#C89B53',red:'#8E352B',green:'#71BC76',panel:'#453728',muted:'#BAA98A'},
 layout:{width:720,height:1280,boardY:[-155,-50,55,160,255,340],boardX:[114,110,106,102,98,94],
  boardHitWidth:105,boardHitHeight:98,benchY:-350,benchSpacing:110,benchPageSize:6,dragThreshold:14,
  modelScale:0.85,benchScale:0.64,healthY:104,headerY:568,footerY:-585},
 speedOptions:[1,2,4],autosaveNote:'本地自动保存',
};
