'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fx = require('../game/play/hero-vfx'), cfg = require('../game/play/hero-vfx-config');
const native = require('../game/play/native-effects'), manifest = require('../game/play/native-effect-manifest');
/** 创建位置可控的只读角色夹具，不加载真实玩家存档。 */
function actor(heroId, x, y) { return { unit: { heroId, magic: true }, node: { isValid: true, position: { x, y } } }; }

test('所有当前武将都有有效武器配置，所有资源可解析', () => {
  for (const hero of require('../game/play/expedition-roster')) {
    const p = fx.profile(hero.id); assert(p, hero.id); assert(manifest[p.impact], hero.id);
    if (hero.range > 1) assert(manifest[p.projectile], hero.id);
  }
  for (const p of Object.values(cfg.skills)) if (p.id) assert(manifest[p.id]);
});

test('武器方向覆盖八向；写实赵云仍保留原有魔法伤害属性', () => {
  const source = actor('zhaoyun', 0, 0);
  for (const [x,y,angle] of [[1,0,0],[1,1,45],[0,1,90],[-1,1,135],[-1,0,180],[-1,-1,-135],[0,-1,-90],[1,-1,-45]])
    assert.equal(fx.direction(source, actor('xuchu',x,y)), angle);
  assert.equal(fx.profile('zhaoyun').profile, 'spear'); assert.equal(source.unit.magic, true);
});

test('普攻和弹道以真实位置及原时长播放，不修改事件与角色', () => {
  const calls=[], original=native.play; native.play=(...args)=>{calls.push(args);return {};};
  try {
    const a=actor('huangzhong',10,20), b=actor('xuchu',110,20), event={critical:true};
    const before=JSON.stringify({a,b,event}),v={root:{},config:{attackDelay:.4}};
    assert(fx.projectile(v,a,b));assert.equal(calls[0][1],'arrow');assert.equal(calls[0][5].duration,.4);
    assert.deepEqual(calls[0][5].travel,{x:110,y:50});assert(fx.hit(v,a,b,event));
    assert.equal(calls[1][5].size,fx.profile('huangzhong').size*cfg.criticalScale);
    assert.equal(JSON.stringify({a,b,event}),before);
    assert.equal(fx.hit(v,actor('unknown',0,0),b,event),false);
    b.node.isValid=false;assert.equal(fx.projectile(v,a,b),false);
  } finally { native.play=original; }
});

test('近战轨迹延迟到接触前；远程不重复生成刀光', () => {
  const calls=[], original=native.play;native.play=(...args)=>calls.push(args);
  try {
    const a=actor('zhaoyun',0,0),b=actor('xuchu',100,0),v={root:{},actors:new Map([[2,b]]),config:{attackDelay:.4}};
    fx.attack(v,a,{target:2,ranged:true});assert.equal(calls.length,0);
    fx.attack(v,a,{target:2,ranged:false});assert.equal(calls.length,1);
    assert.equal(calls[0][5].delay,.4*cfg.trail.contactRatio);assert.equal(calls[0][3],100*cfg.trail.reachRatio);
  } finally { native.play=original; }
});

test('技能只覆写明确配置的效果；关闭开关时回退既有表现', () => {
  assert.deepEqual(fx.skillOptions('freeze'),{});
  assert.equal(fx.skillOptions('execute',actor('xuchu',0,0),actor('zhaoyun',0,2)).angle,90);
  const original=cfg.enabled;try {cfg.enabled=false;assert.equal(fx.profile('zhaoyun'),null);assert.deepEqual(fx.skillOptions('execute'),{});}finally{cfg.enabled=original;}
});

