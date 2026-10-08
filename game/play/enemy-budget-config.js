'use strict';
/** 参考每场普通胜利领取视频二阶武将的成长预算；仅改变装备增益，不隐藏修改基础面板。 */
module.exports={intro:{potency:.12,physical:'7001',magic:'7101'},rewardRank:2,normalFightRatio:.7,equipmentPerWin:.3,maxExpectedStar:4,basePotency:1,resourceWeight:.12,equipmentWeight:.025,maxResourceBonus:.35,randomBonus:.12,retryMultiplier:.4,minPotency:.08,seed:166,fields:['hpPercent','teamArmor','teamMagicArmor','teamRegen','teamHaste','teamMagicPen','teamHeal','regenPercent','block','reduction','leech','reflect'],viewNote:'敌阵依据章节成长与视频奖励资源预算生成，战败视频祝福降低当前敌阵装备增益。'};
