'use strict';
/** 典韦一技能规则与表现；首轮优先选最近敌人，后续恢复近战距离及原9秒冷却。 */
module.exports={hero:'dianwei',skillId:'11051',effect:'dianweiToss',rule:{power:1.5,radius:1,initialCooldown:0,openingGlobal:true,skillEffect:'dianweiToss'},landing:{distance:2},visual:{rollDegrees:360,height:110,ascentRatio:.5,impact:'earthImpact',impactSize:160,impactDuration:.45,offsetY:12,trail:'bladeSweep',trailSize:110,trailDuration:.25,trailFrames:[0,1,2,3,4,5]}};
