"use strict";
const config = require("./battle-appearance");
/** 根据棋盘上的实际目标向量选择八方向，零位移保留当前朝向。 */
function direction(dx, dy, previous = "n") {
  if (Math.hypot(dx, dy) < 0.001) return previous;
  return config.directions[
    (Math.round(Math.atan2(dy, dx) / (Math.PI / 4)) + 8) % 8
  ];
}
/** 将战场方向映射到模型烘焙方向，身份与位移坐标保持不变。 */
function sourceDirection(heroId,facing){const override=config.sourceDirectionOverrides?.[heroId]?.[facing];if(override)return override;const offset=config.sourceDirectionOffsets?.[heroId]||0,index=config.directions.indexOf(facing);return config.directions[(Math.max(0,index)+offset)%config.directions.length];}
/** 将左侧朝向映射到对应源动作并镜像，避免用一张正面图假转向。 */
function animationKey(name, facing, directional) {
  return directional ? name + "-" + (config.mirrored[facing] || facing) : name;
}
/** 调整角色身体朝向，保留血条、星级和装备的正常阅读方向。 */
function face(actor, dx, dy) {
  if(Math.hypot(dx,dy)<0.001)return;
  actor.facing = sourceDirection(actor.unit?.heroId,direction(dx, dy));
  const sign = actor.directional && config.mirrored[actor.facing] ? -1 : 1;
  actor.body.setScale(actor.baseScale * sign, actor.baseScale, 1);
  actor.updateLayout?.();
}
/** 根据源动作长度匹配命中前摇或移动速度，动作结束恢复同方向待机。 */
function animate(actor, name, loop = false, options = {}) {
  if (!actor?.node.isValid) return;
  actor.currentAnimation = { name, loop, options };
  if (!actor.sp.skeletonData) return;
  const key = animationKey(name, actor.facing, actor.directional),
    speed = options.speed || 1,
    duration = actor.manifest?.actions?.[key]?.duration;
  actor.sp.timeScale =
    duration && options.contactDelay
      ? ((duration * config.attackContact) / options.contactDelay) * speed
      : speed;
  actor.sp.setCompleteListener(() => {
    if (!loop && actor.alive && actor.node.isValid)
      animate(actor, "idle", true, { speed });
  });
  actor.sp.setAnimation(0, key, loop);
}
module.exports = { sourceDirection, direction, animationKey, face, animate };
