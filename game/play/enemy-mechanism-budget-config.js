'use strict';
/** 技能机制的有界估算溢价，只分配敌军预算，不改技能自身数值。 */
module.exports={enabled:true,maxPremium:.55,regen:{seconds:12,weight:.75,maxPremium:.22},block:{weight:.35,maxPremium:.08},skills:{maxPremium:.3,kinds:{heal:.08,consume:.10,protect:.06,pact:.04,freeze:.05,silence:.05,taunt:.04},pull:.08,stun:.025,burst:{minPower:8,premium:.06}}};
