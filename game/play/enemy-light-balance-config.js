'use strict';
/** 每章一次战力基准；通关递增、战败视频回退，所有平衡参数集中配置。 */
module.exports={version:8,playerBaseline:{version:1,includeEquipment:false},firstBattle:{section:2,type:'battle',coefficient:1,equipment:false},fromSection:2,types:{battle:1.05,elite:1.20,boss:1.35},initialDifficulty:1,winIncrement:.04,videoStepMultiplier:.5,recoveryWins:3,minWinIncrement:.000001,unknownHistoryRollbackSteps:1,retryFallbackMultiplier:.8,retryChapterPolicies:[{fromChapter:4,multiplier:.85}],minDifficulty:.1,maxDifficulty:30,skillShare:.5,magicIncomingShare:.5,minScale:.01,maxScale:80,minInterval:.1};
