'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{AudioSettings}=require('../game/play/audio-settings'),slider=require('../game/play/volume-slider-view');
test('拖动连续改变音乐与所有音效通道音量，松手保存，旧静音设置兼容',()=>{let saved={music:false,sound:true},writes=0;const music={play(){},pause(){},onError(){}},api={getStorageSync:()=>saved,setStorageSync:(k,v)=>{writes++;saved=v;},createInnerAudioContext:()=>music};const a=new AudioSettings(api),fx=a.register({policy:{volume:.8},slots:[{audio:{}}],stop(){}});a.start();assert.equal(music.volume,0);a.setVolume('music',.65,false);a.setVolume('sound',.5,false);assert.equal(music.volume,.65);assert.equal(fx.slots[0].audio.volume,.4);assert.equal(writes,0);a.save();const b=new AudioSettings(api);assert.equal(b.volume('music'),.65);assert.equal(b.volume('sound'),.5);assert.equal(slider.valueAt(-999,200),0);assert.equal(slider.valueAt(999,200),1);assert.equal(slider.valueAt(0,200),.5);});
test('暴雪同波多目标只生成一片AOE，后续波轮换位置且使用原生暴风雪',()=>{const native=require('../game/play/native-effects'),old=native.play,calls=[];const config=require('../game/play/blizzard-view-config'),enabled=config.enabled;config.enabled=false;native.play=(...args)=>calls.push(args);try{const storm=require('../game/play/blizzard-view'),v={root:{}},a={unit:{uid:1}},b={node:{isValid:true,position:{x:50,y:20}}};storm.begin(v,a,b,{t:5});storm.wave(v,a,b,{t:6});const n=calls.length;assert.equal(n,9);b.node.position.x=200;storm.wave(v,a,b,{t:6});assert.equal(calls.length,n);storm.wave(v,a,b,{t:7});assert.equal(calls.length,18);assert(calls.every(x=>x[1]==='blizzard'));assert(calls.some(x=>x[5].delay>0));assert.equal(v.blizzardCasts.get(1).x,50);assert.notEqual(calls[0][3],calls[n][3]);}finally{native.play=old;config.enabled=enabled;}});

test('暴风雪起手只记录落点，真实命中生成一层雪幕，引导中断回收落冰', () => {
  const native = require('../game/play/native-effects'), storm = require('../game/play/blizzard-view');
  const play = native.play, stop = native.stop, calls = [];
  const v = { root: {}, ui: { node: () => assert.fail('施法起手不能创建表现节点') },
    position: (x, y) => ({ x: x * 100, y: y * 90 }) };
  const caster = { unit: { uid: 1 } }, target = { node: { isValid: true, position: { x: 41, y: 58 } } };
  const wave = { isValid: true };
  native.play = (...args) => { calls.push(args); return wave; };
  native.stop = (_, node) => { node.isValid = false; };
  try {
    storm.begin(v, caster, target, { t: 4, duration: 3, area: { x: 2, y: 2, radius: 2 } });
    assert.equal(calls.length, 0);
    target.node.position.x += 200;
    storm.wave(v, caster, target, { t: 5 });
    storm.wave(v, caster, target, { t: 5 });
    assert.equal(calls.length, 1);
    assert.equal(calls[0][1], 'pixelBlizzardWave');
    assert.equal(calls[0][3], 200);
    assert(storm.replayEvent(v, { type: 'channelInterrupted', t: 5.1, uid: 1 }));
    assert.equal(v.blizzardCasts.size, 0);
    assert.equal(wave.isValid, false);
  } finally {
    native.play = play;
    native.stop = stop;
  }
});

test('虎啸震慑只按张飞的实际被动伤害波播放，且同波不重复', () => {
  const native = require('../game/play/native-effects'), effects = require('../game/play/battle-effects');
  const play = native.play, calls = [];
  const actor = { unit: { heroId: 'zhangfei' }, node: { isValid: true }, body: { position: { y: -55 } } };
  const target = { node: { isValid: true, position: { x: 0, y: 0 } } };
  const view = { root: {}, actors: new Map() };
  native.play = (...args) => { calls.push(args); };
  try {
    effects.hit(view, actor, target, { t: 1, effect: 'rot', skill: true });
    effects.hit(view, actor, target, { t: 1, effect: 'rot', skill: true });
    effects.hit(view, actor, target, { t: 2, effect: 'rot', skill: true });
    actor.alive = false;
    effects.hit(view, actor, target, { t: 3, effect: 'rot', skill: true });
    assert.deepEqual(calls.map(call => [call[1], call[2], call[4]]),
      [['pixelTigerRoar', actor.node, -55], ['pixelTigerRoar', actor.node, -55]]);
  } finally {
    native.play = play;
  }
});
