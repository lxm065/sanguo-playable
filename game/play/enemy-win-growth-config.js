'use strict';
/** 战后增幅策略；阈值为可调初值，不承诺固定场次必败，恢复阶段不使用加速。 */
module.exports={chapterPolicies:[{fromChapter:4,rates:[.30,.60,1.20],recoveryWins:2}],consecutive:{fromWins:4,rates:[.20,.40,.80]},easy:{maxDurationRatio:.4,minSurvivorRatio:.8,minHealthRatio:.5,firstRate:.08,streakRate:.02,maxRate:.16,maxStep:.35},narrow:{maxSurvivorRatio:.4,maxHealthRatio:.2,minDurationRatio:.8,step:.02},epsilon:1e-9};
