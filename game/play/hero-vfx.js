'use strict';
const config = require('./hero-vfx-config');
const native = require('./native-effects');

/** 合并武器类别与武将覆写；未知旧角色走既有特效，不猜测技能。 */
function profile(heroId) {
  const hero = config.heroes[heroId];
  return config.enabled && hero ? { ...config.profiles[hero.profile], ...hero } : null;
}

/** 从真实源目标位置计算屏幕方向，独立于魔法/物理伤害属性。 */
function direction(source, target) {
  const p = source?.node?.position, q = target?.node?.position;
  return p && q ? Math.atan2(q.y - p.y, q.x - p.x) * 180 / Math.PI : 0;
}

/** 普攻命中使用短促的武器反馈，暴击只适度放大；不生成额外伤害。 */
function hit(v, source, target, event) {
  const p = profile(source?.unit?.heroId);
  if (!p || !target?.node?.isValid) return false;
  const q = target.node.position;
  native.play(v, p.impact, v.root, q.x, q.y + (p.offsetY ?? config.offsetY), {
    size: p.size * (event.critical ? config.criticalScale : 1), duration: p.duration,
    angle: p.directional ? direction(source, target) : 0,
    color: p.color, widthRatio: p.widthRatio, heightRatio: p.heightRatio
  });
  return true;
}

/** 为已有远程攻击挑选原始模型弹道，飞行时长仍由战斗攻击延迟决定。 */
function projectile(v, source, target) {
  const p = profile(source?.unit?.heroId);
  if (!p?.projectile || !source.node.isValid || !target?.node?.isValid) return false;
  const a = source.node.position, b = target.node.position;
  native.play(v, p.projectile, v.root, a.x, a.y + config.offsetY, {
    size: p.projectileSize, duration: v.config.attackDelay, angle: direction(source, target),
    travel: { x: b.x, y: b.y + config.offsetY }, color: p.color
  });
  return true;
}

/** 在近战接触前播放短武器轨迹；远程、无目标及未知角色不创建轨迹。 */
function attack(v, source, event) {
  const target = v.actors?.get(event.target), p = profile(source?.unit?.heroId);
  if (!p || event.ranged || !source?.node?.isValid || !target?.node?.isValid) return;
  const a = source.node.position, b = target.node.position, t = config.trail;
  native.play(v, t.id, v.root, a.x + (b.x-a.x)*t.reachRatio, a.y + (b.y-a.y)*t.reachRatio + config.offsetY, {
    size: t.size, duration: t.duration, delay: v.config.attackDelay*t.contactRatio,
    angle: direction(source, target), color: p.color, widthRatio: p.widthRatio, heightRatio: p.heightRatio
  });
}

/** 仅改变已发生技能的显示参数；技能ID、资源语义与持续控制保持原映射。 */
function skillOptions(key, source, target) {
  const rule = config.enabled ? config.skills[key] : null;
  if (!rule) return {};
  const { directional, ...options } = rule;
  if (directional) options.angle = direction(source, target);
  return options;
}

module.exports = { profile, direction, hit, projectile, attack, skillOptions };
