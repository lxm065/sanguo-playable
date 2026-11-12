'use strict';
/** 可确认的章节门槛与本地补全参数分开登记；原服动态参数见交付差异清单。 */
module.exports={version:1,seed:28891,
 modes:{arena:{name:'刀锋竞技',chapter:15},dungeon:{name:'英雄副本',chapter:30}},
 arena:{initialGold:100,initialHp:3,initialCapacity:3,initialPicks:3,maxWins:12,maxLosses:3,roundGold:100,winGold:50,secretPerWin:2,secretPerRun:1,starsPerWin:1},
 dungeon:{sections:9,roundGold:100,bossGold:200,completionDiamonds:500,completionFragments:2,firstCompletionMultiplier:2,openingUnitGrades:[3,4],startingUnits:3,startingHero:'xuchu'},
 economy:{heroPrices:{1:50,2:100,3:150,4:200},equipmentPrices:{2:150,3:300},experiencePrice:100,experienceGain:100,heroGrade:3,refresh:30,population:150,populationStep:50,maxCapacity:12,mergeCount:3,maxStar:5,equipmentSlots:3,choiceCount:3,offerCount:3,merchantGold:100,treasureGold:100,treasureChance:.3,springChance:.3,shopDiscount:.6,experienceMultiplier:3,merchantGoldMultiplier:2,openingEquipmentCount:6},
 enemies:{initialCount:2,everyRounds:4,maxCount:10,starEveryRounds:6,maxStar:4,baseScale:.7,growth:.018,maxScale:1.5},
 lords:{armyBonus:{'1001':1},stealChance:.15,returnChance:.7,blessingEquipment:'7206'},
 view:{pageSize:8,width:680,height:1050,top:480,row:102,boardTop:245,boardBottom:-90,boardX:104,modelScale:.8,heroY:-375,equipmentY:-205,actionY:-550,replayTickMs:40},
 sources:{gates:'UnlockConst + checkEntryOpen',dungeons:'dup_hero_cfg（360条非默认记录）',ranks:'jjc_rank_cfg',local:['敌阵与路线生成','金币、商品价格、人口成长','竞技胜负场上限与积分变化','秘典和副本奖励数量','特殊规则触发的具体随机分布','主公概率参数']}
};
