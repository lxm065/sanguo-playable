"use strict";
/** 多朝向模型烘焙参数；源模型与头像沿用同一身份映射。 */
module.exports = {
  frameSize: 192,
  quality: { defaultFactor: 2, factors: { guanyu: 4 }, palette: false },
  fps: 10,
  targetBodyHeight: 110,
  maxBodyWidth: 98,
  cameraElevation: 0.7,
  cameraMargin: 1.7,
  alphaThreshold: 100,
  visibleSpan: 110,
  directions: { s: 0, se: -45, e: -90, ne: -135, n: -180 },
  actionPatterns: {
    idle: "^Stand(?!.*(?:Hit|Victory|Channel|Spin))",
    run: "^Walk",
    skill1: "^Attack(?!.*(?:Slam|Spin))",
    skill2: "^Spell",
    dead: "^Death",
  },
  loopingLimits: { idle: 2, run: 1.6 },
  overrides: { zhangfei: { padding: 1.04 }, zhaoyun: { padding: 1.12 }, zhouyu: { idle: "Stand Ready" } },
};
