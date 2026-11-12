'use strict';
const manifest = require('./effect-manifest'), config = require('./native-effect-config');
const pixel = require('./pixelfx-config');

/** 保留旧正方形清单的兼容性，新图集显式声明长宽和以左上角为基准的原点。 */
function geometry(entry) {
  return { width: entry.frameWidth ?? entry.size, height: entry.frameHeight ?? entry.size };
}

/** 每张图集只装配一次帧对象，失败后移除缓存以允许正常重试。 */
function frames(v, id) {
  v.nativeFrames = v.nativeFrames || new Map();
  if (!v.nativeFrames.has(id)) {
    const m = manifest[id], { width, height } = geometry(m);
    v.nativeFrames.set(id, v.assets.texture(m.file).then(texture => Array.from({ length: m.count }, (_, i) => {
      const index = m.frameIndices?.[i] ?? i, frame = new v.cc.SpriteFrame();
      frame.texture = texture;
      frame.rect = new v.cc.Rect(index % m.columns * width, Math.floor(index / m.columns) * height, width, height);
      frame.originalSize = new v.cc.Size(width, height);
      frame.offset = new v.cc.Vec2(0, 0);
      frame.addRef();
      return frame;
    })).catch(error => { v.nativeFrames.delete(id); throw error; }));
  }
  return v.nativeFrames.get(id);
}

/** 预热当前开启的轻量图集，避免第一次出手才解码；不加载离线生成器。 */
function warm(v) {
  return Promise.all(Object.keys(manifest).filter(id => pixel.enabled || manifest[id].kind !== 'pixelfx').map(id => frames(v, id)))
    .catch(error => console.warn('原生特效预热失败', error.message));
}

/** 清理唯一帧循环和节点，保留可共享的帧对象缓存。 */
function clear(v) {
  clearInterval(v.nativeTimer);
  v.nativeTimer = null;
  for (const effect of v.nativeEffects || []) end(effect, 'cleared');
  v.nativeEffects = [];
}

/** 生命周期回调只运行一次，死亡、驱散与普通到期可由调用方分别处理。 */
function end(effect, reason) {
  if (effect.ended) return;
  effect.ended = true;
  try { effect.onEnd?.(reason); }
  finally { if (effect.node.isValid) effect.node.destroy(); }
}

/** 默认旧技能优先于装饰反馈，控制附着层按配置获得最高优先级。 */
function priority(id) { return pixel.priorities?.[id] ?? (manifest[id]?.kind === 'pixelfx' ? 0 : 1); }

/** 在可选节点中挑选最低优先级；同级优先淘汰最早的一次性效果。 */
function victim(effects, accepts) {
  let selected = -1;
  effects.forEach((effect, index) => {
    if (!accepts(effect)) return;
    if (selected < 0 || priority(effect.id) < priority(effects[selected].id) ||
      (priority(effect.id) === priority(effects[selected].id) && effects[selected].loop && !effect.loop)) selected = index;
  });
  return selected;
}

/** 延长剩余寿命时保留动画相位，重复短控制不能使长控制提前消失。 */
function extend(v, node, remaining) {
  const effect = (v.nativeEffects || []).find(entry => entry.node === node && !entry.ended && entry.node.isValid);
  if (!effect) return false;
  effect.duration = Math.max(effect.duration, (effect.elapsed || 0) + Math.max(0, remaining));
  return true;
}

/** 主动终止单个效果，不依赖场景销毁或再创建一个计时器。 */
function stop(v, node, reason = 'stopped') {
  const effect = (v.nativeEffects || []).find(entry => entry.node === node);
  if (effect) end(effect, reason);
  else if (node?.isValid) node.destroy();
}

/** 按配置淘汰最旧的一次性反馈，新增粒子不能无限堆积或挤占全部旧技能节点。 */
function reserve(v, id) {
  v.nativeEffects = (v.nativeEffects || []).filter(effect => !effect.ended && effect.node.isValid);
  if (manifest[id].kind === 'pixelfx') {
    const group = manifest[id].budgetGroup, limit = group ? (pixel.budgets?.[group] ?? pixel.maxNodes) : pixel.maxNodes;
    const sameGroup = effect => manifest[effect.id]?.kind === 'pixelfx' && manifest[effect.id].budgetGroup === group;
    if (limit <= 0) return false;
    while (v.nativeEffects.filter(sameGroup).length >= limit) {
      const index = victim(v.nativeEffects, sameGroup);
      if (index < 0 || priority(v.nativeEffects[index].id) > priority(id)) return false;
      end(v.nativeEffects.splice(index, 1)[0], 'evicted');
    }
  }
  while (v.nativeEffects.length >= config.maxNodes) {
    const index = victim(v.nativeEffects, () => true);
    if (index < 0 || priority(v.nativeEffects[index].id) > priority(id)) return false;
    end(v.nativeEffects.splice(index, 1)[0], 'evicted');
  }
  return true;
}

/** 播放真实帧序列；size 表示最长边，锚点和长宽比直接来自生成清单。 */
function play(v, id, parent, x, y, { duration = 0, size = config.sizes[id] || config.defaultSize,
  loop = false, travel = null, angle = 0, spin = 0, follow = null, delay = 0, color = null,
  widthRatio = 1, heightRatio = 1, fadeOut = 0, followTarget = null, targetOffsetY = 0, frameIndices = null, opacity = 255,
  owner = null, resolvePosition = null, onEnd = null } = {}) {
  const m = manifest[id];
  if (!m) return null;
  if (!reserve(v, id)) return null;
  const { width, height } = geometry(m), scale = size / Math.max(width, height);
  const node = v.ui.node(parent, 'native-effect-' + id, x, y, width * scale, height * scale);
  const sprite = node.addComponent(v.cc.Sprite);
  sprite.sizeMode = v.cc.Sprite.SizeMode.CUSTOM;
  if (m.pivot) node.getComponent(v.cc.UITransform).setAnchorPoint(m.pivot[0] / width, 1 - m.pivot[1] / height);
  node.angle = angle;
  node.setScale(widthRatio, heightRatio, 1);
  if (color) sprite.color = new v.cc.Color(color);
  node.active = delay <= 0;
  const effect = { node, sp: sprite, id, loop, travel, follow, angle, spin, x, y, start: null,
    duration: duration || m.count / m.fps, frames: null, fadeOut, followTarget, targetOffsetY,
    owner, resolvePosition, onEnd, baseOpacity: opacity, opacity: fadeOut > 0 || opacity < 255 ? node.addComponent(v.cc.UIOpacity) : null };
  if (effect.opacity) effect.opacity.opacity = opacity;
  v.nativeEffects.push(effect);
  frames(v, id).then(list => {
    if (effect.ended || !node.isValid) return;
    effect.frames = frameIndices ? frameIndices.map(index => list[index]).filter(Boolean) : list;
    effect.start = Date.now(); effect.last = effect.start; effect.elapsed = -Math.max(0, delay);
    sprite.spriteFrame = effect.frames[0];
  }).catch(error => { if (node.isValid) node.destroy(); console.warn('原生特效加载失败', id, error.message); });
  if (!v.nativeTimer) v.nativeTimer = setInterval(() => tick(v), config.frameInterval);
  return node;
}

/** 单一计时器推进全部效果，倍速只影响展示，播放结束和离场立即释放节点。 */
function tick(v) {
  const now = Date.now();
  for (const e of v.nativeEffects || []) {
    if (e.ended) continue;
    if (!e.node.isValid) { end(e, 'destroyed'); continue; }
    if (e.owner && (e.owner.alive === false || !e.owner.node.isValid)) { end(e, 'owner-dead'); continue; }
    if ((e.follow && !e.follow.isValid) || (e.followTarget && !e.followTarget.isValid)) { end(e, 'target-gone'); continue; }
    if (e.start === null) continue;
    const elapsed = (e.elapsed || 0) + (now - (e.last ?? e.start)) / 1000 * (v.speed ?? 1);
    e.elapsed = elapsed; e.last = now;
    if (elapsed < 0) continue;
    e.node.active = true;
    if (elapsed >= e.duration) { end(e, 'expired'); continue; }
    if (e.opacity) e.opacity.opacity = Math.round((e.baseOpacity ?? 255) * (e.fadeOut > 0 ? Math.min(1, (e.duration - elapsed) / (e.duration * e.fadeOut)) : 1));
    if (e.frames) {
      const m = manifest[e.id], index = e.loop ? Math.floor(elapsed * m.fps) % e.frames.length :
        Math.min(e.frames.length - 1, Math.floor(elapsed / e.duration * e.frames.length));
      e.sp.spriteFrame = e.frames[index];
    }
    if (e.follow) e.node.setPosition(e.follow.position.x + e.x, e.follow.position.y + e.y);
    if (e.resolvePosition) { const point = e.resolvePosition(); e.node.setPosition(point.x, point.y); }
    if (e.spin) e.node.angle = e.angle + e.spin * elapsed / e.duration;
    if (e.travel) {
      const t = elapsed / e.duration, target = e.followTarget ?
        { x: e.followTarget.position.x, y: e.followTarget.position.y + e.targetOffsetY } : e.travel;
      e.node.setPosition(e.x + (target.x - e.x) * t, e.y + (target.y - e.y) * t);
      if (e.followTarget) e.node.angle = Math.atan2(target.y - e.y, target.x - e.x) * 180 / Math.PI;
    }
  }
  v.nativeEffects = (v.nativeEffects || []).filter(effect => !effect.ended && effect.node.isValid);
  if (!v.nativeEffects.length) { clearInterval(v.nativeTimer); v.nativeTimer = null; }
}

module.exports = { warm, clear, play, tick, frames, geometry, extend, stop };
