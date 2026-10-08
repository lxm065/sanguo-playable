'use strict';
/** 章节基础曲线、阵容适配和失败缓冲分别配置；不改变英雄技能与奖励。 */
module.exports={chapters:{2:{referenceChapter:1,statMultiplier:1.1,minimumStarBySection:{1:1,2:2,3:2,4:3,5:3},bossOverrides:{1:'taishici'},
 sections:{
  1:{start:.7,end:1,boss:.65,bossStar:3,guardStar:2,expectedStar:1.5,startCount:1,endCount:4,maxStar:2},
  2:{start:.8,end:1,boss:.85,bossStar:3,guardStar:2,expectedStar:2,startCount:4,endCount:5,maxStar:2},
  3:{start:.9,end:1.1,boss:.8,bossStar:3,guardStar:3,expectedStar:2.5,startCount:5,endCount:5,maxStar:3,earlyMaxStar:2,promotionRow:9},
  4:{start:.9,end:1.1,boss:.9,bossStar:4,guardStar:3,expectedStar:3,startCount:5,endCount:6,maxStar:3},
  5:{start:1,end:1.2,boss:1,bossStar:4,guardStar:3,expectedStar:3.5,startCount:6,endCount:6,maxStar:4}
 },eliteMultiplier:1.05,
 population:{fromSection:1,offsets:{battle:0,elite:0,boss:0}},
 adaptive:{perStar:.08,minRoster:.9,maxRoster:1.1,randomAmplitude:.03,seed:20261007,lossStep:.06,maxLosses:3,winRecovery:1,minFactor:.75,maxFactor:1.15}
}}};
