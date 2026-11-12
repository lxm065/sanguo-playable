'use strict';
/** PixelFX 战斗表现开关与预算，技能数值独立配置。 */
module.exports = {
  enabled: true,
  maxNodes: 20,
  budgets: { control: 48 },
  priorities: { pixelCharge: 3, pixelLightningBeam: 3, pixelFirePillar: 4, pixelFireBurst: 2,
    pixelArrow: 2, pixelFireball: 2, pixelIce: 2, pixelSpirit: 2, pixelWater: 2, pixelVenom: 2, pixelLightningHit: 1,
    pixelFrozen: 5, pixelStunned: 5, pixelIceRelease: 1, pixelBlizzardWave: 2, pixelTigerRoar: 1 },
  profiles: {
    spear: { impact: 'pixelHit', size: 58, duration: .2, directional: true, widthRatio: 1, heightRatio: 1,
      trail: { id: 'pixelSpear', size: 142, duration: .24, widthRatio: 1, heightRatio: 1 } },
    blade: { impact: 'pixelHit', size: 66, duration: .22, directional: true, widthRatio: 1, heightRatio: 1,
      trail: { id: 'pixelBlade', size: 122, duration: .24, widthRatio: 1, heightRatio: 1 } },
    bow: { impact: 'pixelHit', size: 46, duration: .18, directional: true, widthRatio: 1, heightRatio: 1,
      projectile: 'pixelArrow', projectileSize: 148, projectileWidthRatio: 1, projectileHeightRatio: 1, projectileColor: '#FFFFFF', projectileLoop: true },
    frost: { projectile: 'pixelIce', projectileSize: 130, projectileColor: '#FFFFFF', projectileLoop: true },
    fire: { impact: 'pixelFireBurst', size: 76, duration: .25, directional: false,
      projectile: 'pixelFireball', projectileSize: 128, projectileColor: '#FFFFFF', projectileLoop: true },
    water: { projectile: 'pixelWater', projectileSize: 75, projectileColor: '#FFFFFF', projectileLoop: true },
    poison: { projectile: 'pixelVenom', projectileSize: 104, projectileColor: '#FFFFFF', projectileLoop: true },
    spirit: { projectile: 'pixelSpirit', projectileSize: 72, projectileColor: '#FFFFFF', projectileLoop: true }
  },
  heroes: {
    zhaoyun: { color: '#E6F3FF' },
    guanyu: { color: '#E6ECCA', trail: { id: 'pixelBlade', size: 138, duration: .26, widthRatio: 1, heightRatio: 1 } },
    zhenji: { projectile: 'pixelWater', projectileSize: 74 },
    xiaoqiao: { projectile: 'pixelSpirit', projectileSize: 68 }
  },
  projectile: { followTarget: true, fadeOut: .12 },
  casts: { limit: 64, hitTolerance: .051 },
  tigerRoar: { enabled: true, hero: 'zhangfei', id: 'pixelTigerRoar', size: 218, duration: .58, fadeOut: .34 },
  skills: {
    lightning: {
      charge: { id: 'pixelCharge', size: 88, offsetY: 42, color: '#FFFFFF' },
      beam: { id: 'pixelLightningBeam', thickness: 42, fromY: 42, toY: 36, seconds: .3 },
      impact: { id: 'pixelLightningHit', size: 140, offsetY: 36, seconds: .34 }
    },
    firePillar: {
      telegraph: { id: 'pixelFireBurst', size: 115, offsetY: 0, color: '#EAB58B', opacity: 88 },
      main: { id: 'pixelFirePillar', size: 285, offsetY: 0, seconds: .85, fadeOut: .3 },
      ground: { id: 'pixelFireBurst', size: 214, offsetY: 0, seconds: .55, fadeOut: .4 },
      impact: { id: 'pixelFireBurst', size: 90, offsetY: 22, seconds: .26, fadeOut: .3 }
    },
    flameWave: { projectile: { id: 'pixelFireball', size: 205, offsetY: 34, loop: true },
      impact: { id: 'pixelFireBurst', size: 115, offsetY: 20, seconds: .3, fadeOut: .3 } },
    fireArrow: { impact: { id: 'pixelFireBurst', size: 76, offsetY: 28, seconds: .22, fadeOut: .35 } },
    ignite: { impact: { id: 'pixelFireBurst', size: 70, offsetY: 20, seconds: .24, fadeOut: .4 } }
  },
  blades: { flame: 'pixelFireball', impact: 'pixelFireBurst', color: '#FFF2DD' },
  blazing: { flame: 'pixelFireball', fire: '#FFF2DD', impact: { id: 'pixelFirePillar', size: 245, duration: .7 },
    shock: { id: 'pixelFireBurst', size: 250, duration: .55 }, hit: { id: 'pixelFireBurst', size: 88, duration: .26 } }
};
