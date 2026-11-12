'use strict';
const pixel = require('./pixelfx-config');
const native = require('./native-effects');

/** 原腐烂事件是虎啸震慑的稳定规则键，其他技能继续使用原表现。 */
function enabled(actor) {
  return pixel.enabled && pixel.tigerRoar.enabled && actor?.unit?.heroId === pixel.tigerRoar.hero;
}

/** 一次被动伤害波只从张飞脚边发出一道虎纹声浪。 */
function hit(v, actor, event) {
  if (event.effect !== 'rot' || !enabled(actor)) return false;
  if (!actor.node?.isValid || actor.alive === false || actor.lastTigerRoar === event.t) return true;
  actor.lastTigerRoar = event.t;
  const { id, size, duration, fadeOut } = pixel.tigerRoar;
  const foot = actor.body?.position?.y ?? 0;
  const node = native.play(v, id, actor.node, 0, foot, { size, duration, fadeOut, owner: actor });
  if (actor.status?.getSiblingIndex && node) node.setSiblingIndex(actor.status.getSiblingIndex());
  return true;
}

module.exports = { enabled, hit };
