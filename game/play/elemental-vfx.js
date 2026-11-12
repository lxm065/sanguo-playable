'use strict';
const config = require('./pixelfx-config'), native = require('./native-effects');
const manifest = require('./effect-manifest');

/** 效果键只查询表现配置，不读取或修改战斗技能数据。 */
function policy(key) { return config.enabled ? config.skills[key] : null; }

/** 统一转换资源描述；预备阶段时长始终由实际施法前摇覆写。 */
function play(v, style, point, options = {}) {
  const { id, seconds, offsetY = 0, ...appearance } = style;
  return native.play(v, id, v.root, point.x, point.y + offsetY, { ...appearance, duration: seconds, ...options });
}

/** 同一施法者的多重施法以预计命中时刻区分，防止后一发覆盖前一发定位。 */
function castState(v, uid, effect, time, target) {
  const states = v.elementalCasts || (v.elementalCasts = []);
  let state = states.find(entry => entry.uid === uid && entry.effect === effect && Math.abs(entry.time - time) <= config.casts.hitTolerance);
  if (!state) {
    state = { uid, effect, time, target, point: target ? { x: target.node.position.x, y: target.node.position.y } : null,
      targets: new Set(), preludes: new Set() };
    states.push(state);
    while (states.length > config.casts.limit) states.shift();
  }
  return state;
}

/** 仅施法事件创建蓄力、地面预兆或飞行，命中爆发留给真实伤害事件。 */
function ability(v, source, target, event) {
  const p = policy(event.effect);
  if (!p || !source?.node?.isValid || !target?.node?.isValid) return false;
  const duration = event.impactDelay ?? v.config.attackDelay;
  const state = castState(v, source.unit.uid, event.effect, (event.t ?? 0) + duration, target);
  if (p.charge) state.preludes.add(play(v, p.charge, { x: 0, y: 0 }, { duration, follow: source.node }));
  if (p.telegraph) state.preludes.add(play(v, p.telegraph, { x: 0, y: 0 }, { duration, follow: target.node }));
  if (p.projectile) {
    const to = target.node.position, offset = p.projectile.offsetY ?? 0;
    play(v, p.projectile, source.node.position, { duration, angle: require('./hero-vfx').direction(source, target),
      travel: { x: to.x, y: to.y + offset }, followTarget: target.node, targetOffsetY: offset });
  }
  return true;
}

/** 动态电弧两端严格对齐真实施法者和受击者，纵横比例分离以控制粗细。 */
function beam(v, source, target, style) {
  const a = source.node.position, b = target.node.position;
  const dx = b.x - a.x, dy = b.y + style.toY - a.y - style.fromY, length = Math.hypot(dx, dy);
  if (!length) return null;
  const m = manifest[style.id], scale = length / m.beamSpan;
  return native.play(v, style.id, v.root, (a.x + b.x) / 2, (a.y + style.fromY + b.y + style.toY) / 2, {
    size: Math.max(m.frameWidth, m.frameHeight) * scale, heightRatio: style.thickness / (m.frameHeight * scale),
    angle: Math.atan2(dy, dx) * 180 / Math.PI, duration: style.seconds, loop: true
  });
}

/** 范围主爆发按同次真实命中去重，每个确实受伤的单位保留局部反馈。 */
function hit(v, source, target, event) {
  const p = policy(event.effect);
  if (!p || !target?.node?.isValid) return false;
  const state = castState(v, source?.unit?.uid ?? event.actor, event.effect, event.t ?? v.elapsed ?? 0, target);
  if (state.targets.has(event.target)) return true;
  const first = state.targets.size === 0;
  state.targets.add(event.target);
  for (const node of state.preludes) if (node?.isValid) node.destroy();
  state.preludes.clear();
  if (first && p.main) {
    const center = state.target?.node?.isValid ? state.target.node.position : state.point || target.node.position;
    play(v, p.main, center);
    if (p.ground) play(v, p.ground, center);
  }
  if (p.beam && source?.node?.isValid) beam(v, source, target, p.beam);
  if (p.impact && (!p.main || state.target !== target)) play(v, p.impact, target.node.position);
  return true;
}

/** 死亡只取消尚未完成的视觉蓄势，不结算任何额外伤害。 */
function death(v, event) {
  if (event.type !== 'death') return;
  for (const state of v.elementalCasts || []) if (state.uid === event.uid || state.target?.unit?.uid === event.uid) {
    for (const node of state.preludes) if (node?.isValid) node.destroy();
    state.preludes.clear();
  }
}

/** 离场时释放施法快照，动画节点由共用播放器清理。 */
function clear(v) { v.elementalCasts = []; }
module.exports = { ability, hit, death, clear, beam };
