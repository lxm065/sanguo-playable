'use strict';
const config = require('./blizzard-view-config');
const pixel = require('./pixelfx-config');
const native = require('./native-effects');

/** 中断或退场时清理引导记录和仍在播放的雪片。 */
function interrupt(v, uid, stopWave = true) {
  const cast = v.blizzardCasts?.get(uid);
  if (!cast) return;
  if (stopWave && cast.wave?.isValid) native.stop(v, cast.wave, 'channel-ended');
  v.blizzardCasts.delete(uid);
}

/** 施法瞬间固定落点；旧战报使用当时的角色位置。 */
function begin(v, source, target, event) {
  if (!source || source.alive === false) return;
  const area = event.area;
  const point = area && v.position ? v.position(area.x, area.y) : target?.node?.position;
  if (!point) return;
  const casts = v.blizzardCasts || (v.blizzardCasts = new Map()), uid = source.unit.uid;
  if (casts.get(uid)?.t === event.t) return;
  interrupt(v, uid);
  casts.set(uid, { x: point.x, y: point.y, t: event.t, until: event.t + (event.duration || 0) });
}

/** 多个目标同一秒受伤只生成一波雪，旧表现仍可独立回退。 */
function wave(v, source, target, event) {
  if (!target?.node?.isValid) return;
  const uid = source?.unit.uid ?? event.actor, p = target.node.position;
  const casts = v.blizzardCasts || (v.blizzardCasts = new Map());
  const cast = casts.get(uid) || { x: p.x, y: p.y, until: event.t };
  if (cast.lastWave === event.t) return;
  cast.lastWave = event.t;
  casts.set(uid, cast);
  if (pixel.enabled && config.enabled) {
    const { id, offsetY, ...options } = config.wave;
    cast.wave = native.play(v, id, v.root, cast.x, cast.y + offsetY, { ...options, owner: source });
    return;
  }
  const { id, offsets, offsetY, size, duration, stagger, rotationStep } = config.legacy;
  const count = cast.count || 0;
  cast.count = count + 1;
  offsets.forEach((_, i) => {
    const [dx, dy] = offsets[(i + count * rotationStep) % offsets.length];
    native.play(v, id, v.root, cast.x + dx, cast.y + dy + offsetY, { size, duration, delay: i * stagger });
  });
}

/** 由现有回放时钟回收落点；最后一波真实命中可播完。 */
function update(v) {
  for (const [uid, cast] of v.blizzardCasts || []) {
    if (v.elapsed >= cast.until) interrupt(v, uid, false);
  }
}

/** 只消费模拟器确认的引导中断，旧战报沿用到期与死亡清理。 */
function replayEvent(v, event) {
  if (event.type !== 'channelInterrupted') return false;
  interrupt(v, event.uid);
  return true;
}

/** 离场清除落冰和定位记录。 */
function clear(v) {
  for (const uid of v.blizzardCasts?.keys() || []) interrupt(v, uid);
}

module.exports = { begin, wave, interrupt, update, replayEvent, clear };
