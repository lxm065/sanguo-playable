'use strict';
const config = require('./control-status-vfx-config'), pixel = require('./pixelfx-config');
const native = require('./native-effects');

/** 状态按实际角色对象和效果分组，旧节点销毁后不串到复用UID的新角色。 */
function entries(v) { return v.controlStatuses || (v.controlStatuses = new Map()); }

/** 读取模型实际脚底、头顶与比例，未装配时使用配置的显示高度。 */
function bounds(actor) {
  const scale = actor.baseScale ?? 1, fallback = config.fallbackBodyHeight * scale;
  const foot = actor.body?.position?.y ?? (actor.centered === false ? 0 : -fallback / 2);
  const head = actor.status?.position?.y ?? foot + fallback + config.headGap;
  return { foot, head, height: Math.max(1, head - foot - config.headGap), scale };
}

/** 星环避开现有技能图标行，冰壳跟随真实模型脚底而非固定屏幕坐标。 */
function position(v, actor, kind) {
  const box = bounds(actor);
  if (kind === 'freeze') return { x: 0, y: box.foot + config.freeze.footOffsetY };
  let top = config.stun.headOffsetY;
  for (const item of v.skillStatuses || []) if (item.actor === actor && item.node.isValid) {
    const style = require('./skill-presentation-config').status;
    top = Math.max(top, item.node.position.y + style.size / 2 + config.stun.iconGap);
  }
  return { x: 0, y: box.head + top };
}

/** 结束一个控制附着层；只有正常到期和实际驱散才显示短促冰屑。 */
function finish(v, state, reason) {
  if (state.closed) return;
  state.closed = true;
  const all = entries(v);
  if (all.get(state.key) === state) all.delete(state.key);
  if (state.kind === 'freeze' && state.actor.frozenEffect === state.node) state.actor.frozenEffect = null;
  if (state.kind === 'freeze' && ['expired', 'cleanse'].includes(reason) && state.actor.node.isValid && state.actor.alive !== false) {
    const box = bounds(state.actor), style = config.freeze.release;
    native.play(v, style.id, state.actor.node, 0, box.foot, { size: box.height * style.sizeFactor,
      duration: style.seconds, owner: state.actor });
  }
}

/** 根据真实状态事件开始或延长动画；短刷新、迟到事件不会缩短已有控制显示。 */
function apply(v, actor, event) {
  if (!actor?.node?.isValid) return false;
  if (event.effect === 'cleanse') { remove(v, actor, true); return false; }
  const kind = event.effect === 'freeze' ? 'freeze' : event.effect === 'stun' ? 'stun' : null;
  if (!kind || !pixel.enabled || !config.enabled) return false;
  if (actor.alive === false) return true;
  const now = Number.isFinite(v.elapsed) ? v.elapsed : (event.t ?? 0);
  const until = (event.t ?? now) + Math.max(0, event.duration || 0);
  const key = actor.unit.uid + ':' + kind, all = entries(v), old = all.get(key);
  if (until <= now) return true;
  if (old && old.actor === actor && old.node?.isValid && !old.closed) {
    const extended = Math.max(old.until, until);
    if (native.extend(v, old.node, extended - now)) { old.until = extended; return true; }
  }
  if (old && !old.closed) { finish(v, old, 'replaced'); native.stop(v, old.node); }
  const style = config[kind], box = bounds(actor), point = position(v, actor, kind);
  const state = { actor, key, kind, until, node: null, closed: false };
  state.node = native.play(v, style.id, actor.node, point.x, point.y, {
    size: kind === 'freeze' ? box.height * style.sizeFactor : style.size * box.scale,
    widthRatio: style.widthRatio ?? 1, duration: until - now, loop: true, owner: actor,
    resolvePosition: () => position(v, actor, kind), onEnd: reason => finish(v, state, reason)
  });
  if (!state.node) return true;
  all.set(key, state);
  if (kind === 'freeze') actor.frozenEffect = state.node;
  state.node.once?.(v.cc?.Node?.EventType?.NODE_DESTROYED || 'destroy', () => finish(v, state, 'destroyed'));
  return true;
}

/** 驱散或死亡移除该角色所有控制表现，其他增益和图标由各自系统处理。 */
function remove(v, actor, release = false) {
  for (const state of [...entries(v).values()]) if (state.actor === actor) {
    const reason = release ? 'cleanse' : 'removed';
    finish(v, state, reason); native.stop(v, state.node, reason);
  }
}

/** 离场只清理附着层和引用，不生成解冻粒子或额外计时器。 */
function clear(v) {
  for (const state of [...entries(v).values()]) { finish(v, state, 'cleared'); native.stop(v, state.node, 'cleared'); }
  entries(v).clear();
}
module.exports = { apply, remove, clear, position };
