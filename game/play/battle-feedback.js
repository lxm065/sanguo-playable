'use strict';
const config = require('./battle-feedback-config');
const pixel = require('./pixelfx-config');
const native = require('./native-effects');
const text = require('./combat-text');
const captions = require('./combat-text-config');
const headGap = require('./battle-hud-config').unit.headGap;

/** 在角色本地坐标播放；同一角色的高频视觉合并，飘字仍逐事件显示。 */
function flash(v, actor, style, event) {
  const { size, duration, minInterval, id } = style;
  const time = event.t ?? v.elapsed ?? 0;
  const history = v.battleFeedbackTimes || (v.battleFeedbackTimes = new WeakMap());
  let times = history.get(actor);
  if (!times) history.set(actor, times = new Map());
  if (minInterval && time - (times.get(id) ?? -Infinity) < minInterval) return;

  const scale = actor.baseScale ?? 1;
  const fallback = config.fallbackBodyHeight * scale;
  const foot = actor.body?.position?.y ?? (actor.centered === false ? 0 : -fallback / 2);
  const height = Math.max(1, (actor.status?.position?.y ?? foot + fallback + headGap) - foot - headGap);
  const y = style.offsetY ?? foot + height * style.heightFactor;
  const node = native.play(v, id, actor.node, 0, y, { size: size * scale, duration, owner: actor });
  if (!node) return;
  if (actor.status?.getSiblingIndex) node.setSiblingIndex(actor.status.getSiblingIndex());
  times.set(id, time);
}

/** 两种回放共用盾吸收、闪避和回血的实际事件入口。 */
function apply(v, event) {
  const kind = event.type;
  if (kind === 'status' && event.effect === 'cleanse') {
    const actor = v.actors.get(event.target);
    if (actor?.alive !== false) text.show(v, actor, captions.beneficial.cleanse, 'cleanse');
    return false;
  }
  if (kind !== 'shield' && kind !== 'evade' && kind !== 'heal') return false;
  const actor = v.actors.get(event.target ?? (kind === 'heal' ? event.uid : undefined));
  if (!actor?.node?.isValid || actor.alive === false) return true;
  if (kind === 'heal' && Number.isFinite(event.hp)) v.ui.health(actor, event.hp);
  if (kind !== 'evade' && !(Number.isFinite(event.amount) && event.amount > 0)) return true;
  if (kind === 'heal') text.show(v, actor, event.amount, 'heal');
  else text.show(v, actor, kind === 'shield' ? captions.status.shield + ' ' + event.amount : captions.status.evade, kind);
  if (pixel.enabled && config.enabled) flash(v, actor, config[kind], event);
  else if (kind === 'heal') flash(v, actor, config.legacyHeal, event);
  return true;
}

/** 净化和解除控制共用真实状态事件，并保留旧资源回退。 */
function cleanse(v, actor, event) {
  if (!actor?.node?.isValid || actor.alive === false) return true;
  for (const status of config.statusRemovedByCleanse) {
    const key = 'status-' + status;
    if (actor[key]?.isValid) native.stop(v, actor[key], 'cleanse');
    delete actor[key];
  }
  if (!pixel.enabled || !config.enabled) return false;
  flash(v, actor, config.cleanse, event);
  return true;
}

/** 开始新回放时清掉上一局的节流记录，节点由原生播放器统一清理。 */
function clear(v) { delete v.battleFeedbackTimes; }

module.exports = { apply, cleanse, clear };
