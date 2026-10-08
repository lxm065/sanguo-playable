"use strict";
const appearance = require("./battle-appearance"),
  config = require("./battle-hud-config").unit;
const centers = require('./body-center-config');
/** 按朝向排除高举武器；渲染、清晰度验证和发布采样共用。 */
function bodyHeightRatio(heroId,direction){return config.directionBodyHeightRatios?.[heroId]?.[appearance.mirrored[direction]||direction]??config.bodyHeightRatios[heroId]??1;}
/** 用待机可见边界计算人物中心和头顶信息位置，避免脚底锚点占据格子中心。 */
function unitLayout(manifest, facing, scale, centered = true, heroId = "") {
  const direction = appearance.mirrored[facing] || facing;
  const sourceHeight =
    manifest?.anchors?.[direction]?.height * manifest?.scale ||
    config.fallbackHeight;
  const bodyFraction = manifest?.anchors
    ? bodyHeightRatio(heroId,direction)
    : 1;
  const ratio = manifest?.anchors
    ? config.modelHeight / (sourceHeight * bodyFraction)
    : 1;
  const height = sourceHeight * bodyFraction * ratio;
  const offset = centered ? -height / 2 : 0;
  return {
    bodyX: -(centers[heroId]?.[direction] || 0) * scale * ratio * (appearance.mirrored[facing] ? -1 : 1),
    bodyY: offset * scale,
    headY: (height + offset) * scale + config.headGap,
    modelScale: scale * ratio,
  };
}
module.exports = { unitLayout, bodyHeightRatio };
