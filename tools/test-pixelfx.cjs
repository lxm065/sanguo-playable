'use strict';
const test = require('node:test'), assert = require('node:assert/strict'), fs = require('node:fs');
const native = require('../game/play/native-effects'), manifest = require('../game/play/effect-manifest');
const pixel = require('../game/play/pixelfx-config'), vfx = require('../game/play/hero-vfx');

/** 只模拟引擎资源边界，真实时间推进和播放器逻辑仍使用待测模块。 */
function fixture() {
  class Frame { /** 共享帧引用由播放器持有。 */ addRef() {} }
  class Rect { /** 保存供断言的原始矩形。 */ constructor(x,y,width,height) { Object.assign(this,{x,y,width,height}); } }
  class Size { /** 保存引擎原始宽高。 */ constructor(width,height) { Object.assign(this,{width,height}); } }
  class Vec2 { /** 保存偏移向量。 */ constructor(x,y) { Object.assign(this,{x,y}); } }
  class Sprite {} Sprite.SizeMode = { CUSTOM: 1 };
  class UITransform {}
  return { speed: 1, root: {}, cc: { SpriteFrame: Frame, Rect, Size, Vec2, Sprite, UITransform }, assets: { texture: async () => ({}) },
    ui: { /** 捕获真实播放器设置的宽高、锚点及销毁行为。 */ node(parent,name,x,y,width,height) {
      return { isValid: true, name, position:{x,y}, width, height,
        /** 节点销毁无需等待图形设备。 */ destroy() { this.isValid=false; },
        /** 捕获旋转以外的比例覆写。 */ setScale(...scale) { this.scale=scale; },
        /** Sprite 和透明度组件使用互不共享的实例。 */ addComponent() { return {}; },
        /** 将引擎锚点调用记录到节点。 */ getComponent() { return { setAnchorPoint:(...anchor)=>{this.anchor=anchor;} }; }
      };
    } }
  };
}

test('导出资源在图集和内存预算内，每帧矩形都位于真实PNG范围且首批没有人偶贴图', () => {
  const config=require('./pixelfx-export.config.json');let totalPngBytes=0,totalRgbaTextureBytes=0;
  for(const entry of config.effects) {
    const m=manifest[entry.id], png=fs.readFileSync('game/skin-assets/'+m.file), width=png.readUInt32BE(16),height=png.readUInt32BE(20);
    totalPngBytes+=png.length;totalRgbaTextureBytes+=width*height*4;
    assert(width<=config.maxAtlasEdge&&height<=config.maxAtlasEdge);
    for(let i=0;i<m.count;i++){assert((i%m.columns+1)*m.frameWidth<=width);assert((Math.floor(i/m.columns)+1)*m.frameHeight<=height);}
    assert(m.pivot[0]>=0&&m.pivot[0]<m.frameWidth);assert(m.pivot[1]>=0&&m.pivot[1]<m.frameHeight);
    if(/^status\//.test(entry.source))assert.equal(m.bodyFree,true);else assert(!/ui\/level-up|moves\//.test(entry.source));
  }
  assert(totalPngBytes<=config.maxPngBytes);assert(totalRgbaTextureBytes<=config.maxTextureBytes);
});

test('长方形图集保持原始宽高及锚点，旧128方形图集不发生比例变化', async () => {
  const v=fixture(), m=manifest.pixelSpear;
  try {
    const list=await native.frames(v,'pixelSpear');
    assert.equal(list[m.columns].rect.y,m.frameHeight);assert.equal(list[0].originalSize.height,m.frameHeight);
    const node=native.play(v,'pixelSpear',v.root,10,20,{size:160,angle:90});
    assert.equal(node.width/node.height,m.frameWidth/m.frameHeight);assert.equal(node.angle,90);
    assert.deepEqual(node.anchor,[m.pivot[0]/m.frameWidth,1-m.pivot[1]/m.frameHeight]);
    const old=native.play(v,'iceNova',v.root,0,0,{size:128});assert.equal(old.width,128);assert.equal(old.height,128);
  } finally {native.clear(v);}
});

test('帧缓存复用同一请求，加载失败后允许重试，离场后异步结果不复活节点', async () => {
  const v=fixture();let count=0,resolve;
  v.assets.texture=()=>{count++;return count===1?Promise.reject(Error('retry')):new Promise(done=>{resolve=done;});};
  await assert.rejects(native.frames(v,'pixelHit'),/retry/);
  const request=native.frames(v,'pixelHit');assert.equal(native.frames(v,'pixelHit'),request);assert.equal(count,2);
  const node=native.play(v,'pixelHit',v.root,0,0);native.clear(v);resolve({});await request;await Promise.resolve();
  assert.equal(node.isValid,false);assert.equal(v.nativeEffects.length,0);assert.equal(v.nativeTimer,null);
});

test('粒子数量受独立预算约束，旧循环技能保留，倍速结束后停止唯一计时器', async () => {
  const v=fixture();
  try {
    const legacy=native.play(v,'shield',v.root,0,0,{loop:true,duration:10});
    for(let i=0;i<pixel.maxNodes+3;i++)native.play(v,'pixelHit',v.root,0,0,{duration:.2});
    await Promise.all([...v.nativeFrames.values()]);await Promise.resolve();
    assert.equal(v.nativeEffects.filter(e=>e.id==='pixelHit').length,pixel.maxNodes);assert.equal(legacy.isValid,true);
    v.speed=2;for(const e of v.nativeEffects){e.last=Date.now()-200;e.elapsed=0;}native.tick(v);
    assert.equal(v.nativeEffects.length,1);native.clear(v);assert.equal(v.nativeTimer,null);
  } finally {native.clear(v);}
});

test('关闭首批开关完整回退，技能、箭矢和法系普攻继续使用旧资源', () => {
  const enabled=pixel.enabled;
  try {
    assert.equal(vfx.profile('zhaoyun').trail.id,'pixelSpear');assert.equal(vfx.profile('guanyu').trail.id,'pixelBlade');
    assert.equal(vfx.profile('huangzhong').projectile,'pixelArrow');assert.equal(vfx.profile('zhenji').impact,'iceNova');
    pixel.enabled=false;assert.equal(vfx.profile('huangzhong').projectile,'arrow');assert.equal(vfx.profile('zhaoyun').impact,'bladeSweep');assert.equal(vfx.profile('zhaoyun').trail,undefined);
  } finally {pixel.enabled=enabled;}
});

test('挑战共用出手入口也播放枪芒，远程不叠加刀光，事件内容保持不变', () => {
  const calls=[],original=native.play;native.play=(...args)=>calls.push(args);
  try {
    const a={unit:{uid:1,heroId:'zhaoyun'},node:{isValid:true,position:{x:0,y:0}}},b={node:{isValid:true,position:{x:100,y:0}}};
    const v={actors:new Map([[1,a],[2,b]]),cc:{},ui:{animate(){}},config:{attackDelay:.4,showAttackStatus:false},root:{}};
    const event={type:'attack',uid:1,target:2,ranged:false},before=JSON.stringify(event);
    require('../game/play/view').PlayView.prototype.apply.call(v,event);
    assert.equal(calls[0][1],'pixelSpear');assert.equal(JSON.stringify(event),before);
    event.ranged=true;v.projectile=()=>{};require('../game/play/view').PlayView.prototype.apply.call(v,event);assert.equal(calls.length,1);
  } finally {native.play=original;}
});

test('升星仅对事务前已存在且真实升阶的可见角色反馈，不给失败或新建角色误报', () => {
  const feedback=require('../game/play/upgrade-feedback'),original=feedback.play,calls=[];feedback.play=(...args)=>calls.push(args);
  try {
    const v={model:{state:{units:[{uid:1,star:3},{uid:2,star:2},{uid:3,star:4}]}},actors:new Map([[1,{node:{isValid:true}}],[2,{node:{isValid:true}}],[3,{node:{isValid:true}}]])};
    require('../game/play/upgrade-effects').show(v,new Map([[1,2],[2,2]]));assert.equal(calls.length,1);assert.equal(calls[0][2],'hero');
  } finally {feedback.play=original;}
});
