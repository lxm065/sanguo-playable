'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fx=require('../game/play/zhouyu-effects'),native=require('../game/play/native-effects');
/** 创建独立角色夹具，保留真实源目标坐标而不读写玩家档。 */
function actor(uid,x,y,heroId='zhouyu'){return {unit:{uid,heroId},node:{isValid:true,position:{x,y}}};}
/** 临时记录原生播放器调用，测试后恢复公共接口。 */
function calls(run){const original=native.play,list=[];native.play=(...args)=>{list.push(args);return {};};try{run(list);}finally{native.play=original;}}

test('火柱施法只播预兆，命中主火柱按同次范围伤害去重',()=>calls(list=>{
  const a=actor(1,0,0),b=actor(2,100,20,'xuchu'),other=actor(3,130,20,'guanyu'),v={root:{},config:{attackDelay:.4}};
  const input={effect:'firePillar',impactDelay:.4,target:2,t:1},before=JSON.stringify({a,b,input});
  assert(fx.ability(v,a,b,input));assert.deepEqual(list.map(c=>c[1]),['zhouyuGround']);
  assert.equal(list[0][5].duration,.4);assert.equal(list[0][5].follow,b.node);
  fx.hit(v,a,b,{effect:'firePillar',target:2,t:1.4});fx.hit(v,a,other,{effect:'firePillar',target:3,t:1.4});
  assert.equal(list.filter(c=>c[1]==='zhouyuPillar'&&c[5].heightRatio>1).length,1);
  const count=list.length;fx.hit(v,a,other,{effect:'firePillar',target:3,t:1.4});assert.equal(list.length,count);
  assert.equal(JSON.stringify({a,b,input}),before);fx.clear(v);assert.equal(v.zhouyuCasts.size,0);
}));

test('龙破在出手时启动朝向正确的弹道，时长与伤害前摇相同',()=>calls(list=>{
  const a=actor(1,20,20),b=actor(2,20,120,'xuchu'),v={root:{},config:{attackDelay:.4}};
  assert(fx.ability(v,a,b,{effect:'flameWave',impactDelay:.6,target:2}));
  assert.equal(list[0][1],'zhouyuWave');assert.equal(list[0][5].duration,.6);assert.equal(list[0][5].angle,90);
  assert.equal(list[0][5].followTarget,b.node);assert.deepEqual(list[0][5].travel,{x:20,y:154});
  fx.hit(v,a,b,{effect:'flameWave',target:2,t:.6});assert.equal(list[1][1],'zhouyuPillar');
}));

test('神灭蓄光不提前显示命中；非周瑜与失效目标交还原路由',()=>calls(list=>{
  const a=actor(1,0,0),b=actor(2,120,0,'xuchu'),v={root:{},config:{attackDelay:.4}};
  assert(fx.ability(v,a,b,{effect:'lightning',impactDelay:.4}));assert.deepEqual(list.map(c=>c[1]),['lightning']);
  assert.equal(fx.ability(v,actor(3,0,0,'huangyueying'),b,{effect:'lightning'}),false);
  assert.equal(fx.hit(v,a,b,{effect:'freeze'}),false);b.node.isValid=false;assert.equal(fx.hit(v,a,b,{effect:'lightning'}),false);
}));

test('新弹道跟踪移动目标，尾段渐隐并在结束后释放',()=>{
  const n={isValid:true,setPosition(x,y){this.x=x;this.y=y;},destroy(){this.isValid=false;}},target={isValid:true,position:{x:120,y:30}};
  const now=Date.now(),e={node:n,id:'zhouyuWave',sp:{},frames:[0],start:now,last:now,elapsed:.5,duration:1,x:0,y:0,travel:{x:100,y:0},followTarget:target,targetOffsetY:20,fadeOut:.4,opacity:{opacity:255}};
  const v={speed:0,nativeEffects:[e]};native.tick(v);assert.equal(n.x,60);assert.equal(n.y,25);
  e.elapsed=.9;native.tick(v);assert(e.opacity.opacity>0&&e.opacity.opacity<100);
  target.isValid=false;native.tick(v);assert.equal(n.isValid,false);assert.equal(v.nativeEffects.length,0);
});
