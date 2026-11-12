'use strict';
/** 控制状态仅配置表现；时长和是否生效取自战斗状态事件。 */
module.exports = {
  enabled: true,
  fallbackBodyHeight: 120,
  headGap: require('./battle-hud-config').unit.headGap,
  freeze: { id: 'pixelFrozen', sizeFactor: 1.2, widthRatio: 1.2, footOffsetY: -3,
    release: { id: 'pixelIceRelease', sizeFactor: 1, seconds: .32 } },
  stun: { id: 'pixelStunned', size: 90, headOffsetY: 54, iconGap: 16 }
};
