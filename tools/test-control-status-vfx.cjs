'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const native=require('../game/play/native-effects'),fx=require('../game/play/control-status-vfx');
const pixel=require('../game/play/pixelfx-config'),config=require('../game/play/control-status-vfx-config');

/** 以最小引擎边界夹具运行正式播放器，计时、刷新和生命周期均由待测代码执行。 */
function fixture(){
 class Frame{/** 共享图集帧引用。 */addRef(){}}
 class Rect{/** 保留帧矩形。 */constructor(x,y,w,h){Object.assign(this,{x,y,w,h});}}
 class Size{/** 保留帧原始尺寸。 */constructor(width,height){Object.assign(this,{width,height});}}
 class Vec2{/** 保留图集偏移。 */constructor(x,y){Object.assign(this,{x,y});}}
 class Sprite{}Sprite.SizeMode={CUSTOM:1};class UITransform{}class UIOpacity{}
 /** 创建可观察真实销毁事件的节点，不模拟状态业务。 */
 function node(parent,name,x=0,y=0){const listeners=new Map();return {parent,name,isValid:true,position:{x,y},
  /** 保存由播放器设置的位置。 */setPosition(x,y){this.position={x,y};},
  /** 保存比例以核对原模型没有被状态替换。 */setScale(...scale){this.scale=scale;},
  /** 提供独立的引擎组件。 */addComponent(){return {};},
  /** 记录锚点设置。 */getComponent(){return {setAnchorPoint(){}};},
  /** 注册节点结束通知。 */once(event,handler){listeners.set(event,handler);},
  /** 销毁只通知一次。 */destroy(){if(!this.isValid)return;this.isValid=false;listeners.get('destroy')?.();}
 };}
 const actor={unit:{uid:1,heroId:'xuchu'},alive:true,baseScale:1,node:node(null,'actor'),body:{position:{y:-60}},status:{position:{y:60+config.headGap}}};
 return {actor,v:{elapsed:0,speed:0,root:{},config:{},cc:{SpriteFrame:Frame,Rect,Size,Vec2,Sprite,UITransform,UIOpacity,Node:{EventType:{NODE_DESTROYED:'destroy'}}},ui:{node},assets:{texture:async()=>({})}}};
}

/** 等待真实图集缓存的Promise完成，不用伪造动画状态。 */
async function ready(v){await Promise.all([...v.nativeFrames.values()]);await Promise.resolve();}

test('冰封与眩晕从实际状态事件显示，迟到、零时长及死亡状态不产生假控制',async()=>{
 const {v,actor}=fixture(),event={effect:'freeze',t:0,duration:3},before=JSON.stringify(actor.unit);
 try{require('../game/play/skill-effects').status(v,actor,event);await ready(v);assert.equal(v.controlStatuses.size,1);assert.equal(v.nativeEffects[0].id,'pixelFrozen');assert.equal(v.nativeEffects[0].node.parent,actor.node);assert.equal(JSON.stringify(actor.unit),before);assert.deepEqual(event,{effect:'freeze',t:0,duration:3});
  fx.clear(v);v.elapsed=4;assert(fx.apply(v,actor,{effect:'stun',t:0,duration:2}));assert.equal(v.controlStatuses.size,0);
  fx.apply(v,actor,{effect:'freeze',t:4,duration:0});assert.equal(v.controlStatuses.size,0);actor.alive=false;fx.apply(v,actor,{effect:'stun',t:4,duration:2});assert.equal(v.controlStatuses.size,0);
 }finally{native.clear(v);}
});

test('重复控制保留节点和动画相位，短刷新不缩时，长刷新延长至实际结束',async t=>{
 let time=1000;t.mock.method(Date,'now',()=>time);const {v,actor}=fixture();
 try{fx.apply(v,actor,{effect:'freeze',t:0,duration:3});await ready(v);const node=actor.frozenEffect,e=v.nativeEffects[0];v.speed=1;time+=1000;v.elapsed=1;native.tick(v);const phase=e.elapsed;
  fx.apply(v,actor,{effect:'freeze',t:1,duration:.5});assert.equal(actor.frozenEffect,node);assert.equal(e.duration,3);assert.equal(e.elapsed,phase);
  fx.apply(v,actor,{effect:'freeze',t:1,duration:5});assert.equal(actor.frozenEffect,node);assert.equal(e.duration,6);
  time+=5000;v.elapsed=6;native.tick(v);assert.equal(v.controlStatuses.size,0);assert.equal(actor.frozenEffect,null);assert.equal(v.nativeEffects.filter(e=>e.id==='pixelIceRelease').length,1);
  native.tick(v);assert.equal(v.nativeEffects.filter(e=>e.id==='pixelIceRelease').length,1);
 }finally{native.clear(v);}
});

test('冰封和眩晕可独立结束，驱散即刻清理，原有其他增益图标保持',async()=>{
 const {v,actor}=fixture(),buff={actor,node:{isValid:true,position:{y:80}},key:'other'};v.skillStatuses=[buff];
 try{fx.apply(v,actor,{effect:'freeze',t:0,duration:3});fx.apply(v,actor,{effect:'stun',t:0,duration:5});await ready(v);
  assert.equal(v.controlStatuses.size,2);const stars=v.nativeEffects.find(e=>e.id==='pixelStunned');native.tick(v);assert(stars.node.position.y>actor.status.position.y+80);
  assert.equal(fx.apply(v,actor,{effect:'cleanse',t:1,duration:5}),false);assert.equal(v.controlStatuses.size,0);assert.equal(actor.frozenEffect,null);assert.equal(v.skillStatuses[0],buff);assert.equal(buff.node.isValid,true);
  assert.equal(v.nativeEffects.filter(e=>!e.ended&&e.id==='pixelIceRelease').length,1);
 }finally{native.clear(v);}
});

test('状态跟随模型脚底和头顶，暂停不倒计时，死亡与离场不遗留星环或冰屑',async t=>{
 let time=2000;t.mock.method(Date,'now',()=>time);const {v,actor}=fixture();
 try{fx.apply(v,actor,{effect:'freeze',t:0,duration:3});fx.apply(v,actor,{effect:'stun',t:0,duration:3});await ready(v);
  const freeze=v.nativeEffects.find(e=>e.id==='pixelFrozen'),stars=v.nativeEffects.find(e=>e.id==='pixelStunned');actor.body.position.y=-70;actor.status.position.y=90;time+=5000;native.tick(v);
  assert.equal(freeze.elapsed,0);assert.equal(freeze.node.position.y,-70+config.freeze.footOffsetY);assert.equal(stars.node.position.y,90+config.stun.headOffsetY);
  actor.alive=false;native.tick(v);assert.equal(v.controlStatuses.size,0);assert.equal(v.nativeEffects.length,0);assert.equal(v.nativeTimer,null);
 }finally{fx.clear(v);native.clear(v);}
});

test('控制附着层有独立预算，满屏小特效优先退让；全场清理不生成新节点',async()=>{
 const {v,actor}=fixture();
 try{for(let i=0;i<pixel.maxNodes;i++)native.play(v,'pixelFireball',v.root,0,0,{duration:5,loop:true});
  for(let i=0;i<24;i++){const a={...actor,unit:{uid:i+1,heroId:'xuchu'}};fx.apply(v,a,{effect:'freeze',t:0,duration:5});fx.apply(v,a,{effect:'stun',t:0,duration:5});}
  await ready(v);assert.equal(v.controlStatuses.size,48);assert([...v.controlStatuses.values()].every(s=>s.node.isValid));assert(v.nativeEffects.length<=require('../game/play/native-effect-config').maxNodes);
  fx.clear(v);native.clear(v);assert.equal(v.controlStatuses.size,0);assert.equal(v.nativeEffects.length,0);assert.equal(v.nativeTimer,null);
 }finally{fx.clear(v);native.clear(v);}
});

test('关闭表现开关仍返回既有控制路由，不更改控制和免疫规则',()=>{
 const {v,actor}=fixture(),enabled=pixel.enabled;try{pixel.enabled=false;assert.equal(fx.apply(v,actor,{effect:'freeze',duration:3,t:0}),false);assert.equal(fx.apply(v,actor,{effect:'stun',duration:2,t:0}),false);assert.equal(v.nativeEffects,undefined);}finally{pixel.enabled=enabled;native.clear(v);}
});
