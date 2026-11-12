'use strict';
/** 瞬时反馈的位置与频率按角色比例和战斗时间配置。 */
module.exports = {
  enabled: true,
  shield: { id: 'pixelShieldAbsorb', size: 138, heightFactor: .48, duration: .34, minInterval: .14 },
  evade: { id: 'pixelEvade', size: 134, heightFactor: .44, duration: .28, minInterval: .14 },
  heal: { id: 'pixelHealPulse', size: 122, heightFactor: 0, duration: .63, minInterval: .65 },
  cleanse: { id: 'pixelCleanse', size: 122, heightFactor: 0, duration: .49 },
  legacyHeal: { id: 'heal', size: 100, offsetY: 44, duration: .8, minInterval: 2.5 },
  fallbackBodyHeight: 120,
  statusRemovedByCleanse: ['freeze', 'stun', 'slow', 'silence', 'taunt'],
};
