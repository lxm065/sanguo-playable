'use strict';
/** 周瑜三技表现参数；仅控制素材、位置、节奏，不参与技能结算。 */
module.exports = {
  enabled: true,
  hero: 'zhouyu',
  fadeOut: .45,
  effects: {
    firePillar: {
      kind: 'pillar',
      prelude: { id: 'zhouyuGround', size: 210, offsetY: 5, widthRatio: 1.15, heightRatio: .55 },
      main: { id: 'zhouyuPillar', size: 340, offsetY: 210, heightRatio: 2.4, seconds: .85 },
      ground: { id: 'zhouyuGround', size: 310, offsetY: 10, widthRatio: 1.3, heightRatio: .6, seconds: .7 },
      impact: { id: 'zhouyuPillar', size: 126, offsetY: 32, seconds: .42 }
    },
    flameWave: {
      kind: 'wave',
      projectile: { id: 'zhouyuWave', size: 220, offsetY: 34, widthRatio: 1.65, heightRatio: .72 },
      impact: { id: 'zhouyuPillar', size: 155, offsetY: 40, seconds: .36 }
    },
    lightning: {
      kind: 'thunder',
      charge: { id: 'lightning', size: 108, offsetY: 58 },
      beam: { texture: 'native-effects/lightningStrip.png', width: 34, fromY: 55, toY: 42, seconds: .3, color: '#DCEAFF' },
      impact: { id: 'zhouyuThunder', size: 240, offsetY: 76, seconds: .48 }
    }
  }
};
