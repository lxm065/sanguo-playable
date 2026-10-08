'use strict';
const config = require('./zhouyu-effects-config');
const native = require('./native-effects');

/** 仅接管已配置的周瑜技能，其他武将和未配置效果沿用原有表现。 */
function policy(source, key) {
  return config.enabled && source?.unit?.heroId === config.hero ? config.effects[key] : null;
}

/** 将一个资源描述转换为统一原生播放参数，所有节点共享上限与回放时钟。 */
function play(v, spec, point, options = {}) {
  const { id, seconds, offsetY = 0, ...style } = spec;
  return native.play(v, id, v.root, point.x, point.y + offsetY, {
    ...style, duration: seconds, fadeOut: config.fadeOut, ...options
  });
}

/** 每名施法者每个技能保留一个施法快照，用于范围效果去重与命中定位。 */
function state(v, source, key) {
  const all = v.zhouyuCasts || (v.zhouyuCasts = new Map());
  const id = source.unit.uid + ':' + key;
  if (!all.has(id)) all.set(id, { hitTime: null, targets: new Set() });
  return all.get(id);
}

/** 消费真实施法事件：火柱预兆、龙破飞行、神灭蓄光均止于原命中前摇。 */
function ability(v, source, target, event) {
  const p = policy(source, event.effect);
  if (!p || !source?.node?.isValid || !target?.node?.isValid) return false;
  const from = source.node.position, to = target.node.position;
  const cast = state(v, source, event.effect);
  cast.target = target;
  cast.point = { x: to.x, y: to.y };
  cast.hitTime = null;
  cast.targets.clear();
  const duration = event.impactDelay ?? v.config.attackDelay;
  if (p.kind === 'pillar') play(v, p.prelude, { x: 0, y: 0 }, { duration, follow: target.node });
  if (p.kind === 'wave') {
    play(v, p.projectile, from, {
      duration, angle: require('./hero-vfx').direction(source, target),
      travel: { x: to.x, y: to.y + p.projectile.offsetY }, followTarget: target.node,
      targetOffsetY: p.projectile.offsetY, fadeOut: 0
    });
  }
  if (p.kind === 'thunder') play(v, p.charge, { x: 0, y: 0 }, { duration, follow: source.node });
  return true;
}

/** 命中时连接施法者与受击者的电弧，跟随当前朝向并自动渐隐和销毁。 */
function beam(v, source, target, p) {
  const a = source.node.position, b = target.node.position;
  const dx = b.x-a.x, dy = b.y+p.toY-a.y-p.fromY;
  const n = v.ui.image(v.root, p.texture, (a.x+b.x)/2, (a.y+p.fromY+b.y+p.toY)/2, Math.hypot(dx,dy), p.width);
  n.name = 'zhouyu-thunder-beam';
  n.angle = Math.atan2(dy,dx)*180/Math.PI;
  n.getComponent(v.cc.Sprite).color = new v.cc.Color(p.color);
  const alpha = n.addComponent(v.cc.UIOpacity);
  const nodes = v.zhouyuBeams || (v.zhouyuBeams = new Set());
  nodes.add(n);
  const tween = v.cc.tween(alpha).to(p.seconds/(v.speed||1),{opacity:0}).call(()=>{if(n.isValid)n.destroy();}).start();
  n.once(v.cc.Node.EventType.NODE_DESTROYED,()=>{tween.stop();nodes.delete(n);});
  return n;
}

/** 消费真实伤害事件；范围主效果只播一次，局部反馈只落在实际受击目标。 */
function hit(v, source, target, event) {
  const p = policy(source, event.effect);
  if (!p || !target?.node?.isValid) return false;
  const cast = state(v, source, event.effect);
  if (cast.hitTime !== event.t) { cast.hitTime = event.t; cast.targets.clear(); }
  if (cast.targets.has(event.target)) return true;
  const first = cast.targets.size === 0;
  cast.targets.add(event.target);
  if (p.kind === 'pillar' && first) {
    const center = cast.target?.node?.isValid ? cast.target.node.position : cast.point || target.node.position;
    play(v, p.main, center);
    play(v, p.ground, center);
  }
  if (p.kind === 'thunder' && source?.node?.isValid) beam(v, source, target, p.beam);
  if (p.kind !== 'pillar' || target !== cast.target) play(v, p.impact, target.node.position);
  return true;
}

/** 离开战斗时回收电弧节点和施法快照，原生动画由统一播放器清理。 */
function clear(v) {
  for (const node of v.zhouyuBeams || []) if (node.isValid) node.destroy();
  v.zhouyuBeams = new Set();
  v.zhouyuCasts = new Map();
}

module.exports = { ability, hit, clear };
