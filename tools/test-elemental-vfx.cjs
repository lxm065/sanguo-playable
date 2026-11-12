'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fx=require('../game/play/elemental-vfx'),native=require('../game/play/native-effects'),config=require('../game/play/pixelfx-config');
/** 使用真实坐标构建角色，仅隔离显示API，不创建玩家存档。 */
function actor(uid,x,y,heroId='zhouyu'){return {unit:{uid,heroId},node:{isValid:true,position:{x,y}}};}
/** 临时记录渲染端调用，并在异常时保证恢复原生播放器。 */
function capture(run){const original=native.play,calls=[];native.play=(...args)=>{const node={isValid:true,destroy(){this.isValid=false;}};calls.push({args,node});return node;};try{run(calls);}finally{native.play=original;}}

test('蓄力和弹道严格使用真实前摇，出手时没有命中爆发，输入事件保持不变',()=>capture(calls=>{
 const a=actor(1,10,20),b=actor(2,110,50,'xuchu'),v={root:{},config:{attackDelay:.4}},event={t:1,effect:'lightning',impactDelay:.6,target:2};
 const before=JSON.stringify({a,b,event});assert(fx.ability(v,a,b,event));assert.deepEqual(calls.map(c=>c.args[1]),['pixelCharge']);assert.equal(calls[0].args[5].duration,.6);
 calls.length=0;fx.ability(v,a,b,{t:2,effect:'flameWave',impactDelay:.5,target:2});
 assert.equal(calls[0].args[1],'pixelFireball');assert.equal(calls[0].args[5].duration,.5);assert.equal(calls[0].args[5].followTarget,b.node);
 assert.deepEqual(calls[0].args[5].travel,{x:110,y:84});assert.equal(JSON.stringify({a,b,event}),before);
}));

test('范围伤害只生成一次主火柱；逐目标命中去重，连续多重施法独立定位',()=>capture(calls=>{
 const a=actor(1,0,0),b=actor(2,100,20,'xuchu'),c=actor(3,300,20,'xuchu'),v={root:{},config:{attackDelay:.4}};
 fx.ability(v,a,b,{t:1,effect:'firePillar',impactDelay:.4});fx.ability(v,a,c,{t:1.2,effect:'firePillar',impactDelay:.4});
 fx.hit(v,a,b,{t:1.4,effect:'firePillar',target:2});fx.hit(v,a,c,{t:1.4,effect:'firePillar',target:3});fx.hit(v,a,c,{t:1.4,effect:'firePillar',target:3});
 let pillars=calls.filter(c=>c.args[1]==='pixelFirePillar');assert.equal(pillars.length,1);assert.equal(pillars[0].args[3],100);
 fx.hit(v,a,c,{t:1.6,effect:'firePillar',target:3});pillars=calls.filter(c=>c.args[1]==='pixelFirePillar');assert.equal(pillars.length,2);assert.equal(pillars[1].args[3],300);
 assert.equal(v.elementalCasts.length,2);
}));

test('电弧覆盖真实两端，距离改变只影响横向长度，粗细由配置控制',()=>capture(calls=>{
 const a=actor(1,0,0),b=actor(2,240,6,'xuchu'),v={root:{}};fx.beam(v,a,b,config.skills.lightning.beam);
 const args=calls[0].args,m=require('../game/play/effect-manifest').pixelLightningBeam;
 const scale=args[5].size/Math.max(m.frameWidth,m.frameHeight);
 assert(Math.abs(scale*m.beamSpan-240)<1e-8);assert(Math.abs(m.frameHeight*scale*args[5].heightRatio-config.skills.lightning.beam.thickness)<1e-8);
 assert.equal(args[3],120);assert.equal(args[5].angle,0);
}));

test('死亡取消蓄势；关闭开关后返回旧路由；快照数量和退出清理有界',()=>capture(calls=>{
 const a=actor(1,0,0),b=actor(2,100,0,'xuchu'),v={root:{},config:{attackDelay:.4}};
 fx.ability(v,a,b,{t:1,effect:'lightning',impactDelay:.4});const node=calls[0].node;fx.death(v,{type:'death',uid:1});assert.equal(node.isValid,false);
 const enabled=config.enabled;try{config.enabled=false;assert.equal(fx.ability(v,a,b,{effect:'lightning'}),false);assert.equal(fx.hit(v,a,b,{effect:'firePillar'}),false);}finally{config.enabled=enabled;}
 for(let i=0;i<config.casts.limit+5;i++)fx.hit(v,a,b,{t:i*2,effect:'ignite',target:2});assert.equal(v.elementalCasts.length,config.casts.limit);fx.clear(v);assert.equal(v.elementalCasts.length,0);
}));

test('技能路由和普攻弹道均读取新配置，原技能次数与射程不受渲染影响',()=>capture(calls=>{
 const a=actor(1,0,0,'huangzhong'),b=actor(2,100,50,'xuchu'),v={root:{},config:{attackDelay:.4}};
 const before=JSON.stringify({a,b});assert(require('../game/play/hero-vfx').projectile(v,a,b));assert.equal(calls[0].args[1],'pixelArrow');assert.equal(calls[0].args[5].followTarget,b.node);
 assert.equal(calls[0].args[5].duration,.4);assert.equal(JSON.stringify({a,b}),before);
 const s=actor(3,0,0);require('../game/play/skill-effects').ability(v,s,b,{t:1,effect:'firePillar',impactDelay:.4});
 assert.equal(calls.at(-1).args[1],'pixelFireBurst');require('../game/play/battle-effects').hit(v,s,b,{t:1.4,effect:'firePillar',target:2});
 assert(calls.some(c=>c.args[1]==='pixelFirePillar'));
}));

test('同屏达到预算时普通火花不能挤掉火柱与关键弹道',()=>{
 const m=require('../game/play/effect-manifest');assert(config.priorities.pixelFirePillar>=(config.priorities.pixelArrow||0));
 // 使用真实播放器的资源边界夹具验证拒绝行为，避免只验证配置数值。
 const nodes=Array.from({length:config.maxNodes},()=>({id:'pixelFirePillar',node:{isValid:true,destroy(){this.isValid=false;}}}));
 const v={nativeEffects:nodes};assert(m.pixelFirePillar);assert.equal(native.play(v,'pixelHit',{},0,0),null);assert.equal(v.nativeEffects.length,config.maxNodes);assert(v.nativeEffects.every(e=>e.node.isValid));
});
