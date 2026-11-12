'use strict';
/** 落点取自战报，雪幕图集和显示参数独立配置。 */
module.exports = {
  enabled: true,
  wave: { id: 'pixelBlizzardWave', size: 320, duration: .74, offsetY: 27, fadeOut: .42 },
  legacy: { id: 'blizzard', size: 265, duration: 1.1, offsetY: 70, stagger: .055, rotationStep: 2,
    offsets: [[-110,55],[0,70],[110,55],[-145,-20],[-40,-15],[75,-5],[145,-35],[-80,-95],[40,-85]] },
};
