'use strict';
const test=require('node:test'),a=require('node:assert/strict'),source=require('../game/play/expedition-roster'),config=require('../game/play/challenge-config'),rules=require('../game/play/config'),roster=require('../game/play/challenge-roster').create(source,config);
test('多人升级保持独立成长和入局技能，并按对应等级解锁所有武将技能',()=>{
 for(const h of source){const generated=roster.find(r=>r.id===h.id),base=h.tiers?.find(t=>t.star===h.tier)||h;
  for(const t of generated.tiers){const expected=h.tiers?.find(x=>x.star===Math.max(h.tier,t.star))||h;
   a.deepEqual(t.skills,expected.skills,h.id+':'+t.star);
   a.equal(t.hp,Math.round(base.hp*Math.pow(config.levelGrowth.hp,t.star-config.initialLevel)));
   a.equal(t.attack,Math.round(base.attack*Math.pow(config.levelGrowth.attack,t.star-config.initialLevel)));
  }
 }
 const z=roster.find(h=>h.id==='zhangfei').tiers.find(t=>t.star===5);a.equal(z.hp,4982);a.equal(z.attack,239);a.equal(z.skills.length,4);
});
test('截图张飞生命攻击可复现，新增高阶技能进入实际战斗初始化',()=>{
 const units=[{uid:1,heroId:'zhangfei',star:5,slot:0},{uid:2,heroId:'xuchu',star:1,slot:1}],equipment=[{uid:11,id:'7101',owner:1},{uid:12,id:'7101',owner:1}];
 const prepared=require('../game/play/expedition-combat').prepareBattle(units,[{uid:-1,heroId:'xuchu',star:5,slot:0}],roster,rules,1,equipment),z=prepared[0],events=[];
 a.equal(z.hp,5381);a.equal(z.attack,359);a.equal(z.armor,10);a.equal(z.magicArmor,20);
 require('../game/play/hero-skills').initialize(prepared,events);a(events.some(e=>e.target===1&&e.skillId==='12093'));a(z.skills.some(s=>s.id==='12094'));
});
test('播放中速度可循环切换，切换前时间按旧速度累计，结束后不修改',()=>{
 const {cycle}=require('../game/play/challenge-replay-speed'),original=Date.now;Date.now=()=>2000;
 try{const v={playing:true,host:{model:{state:{meta:{cleared:99}}}},config:{speedOptions:[1,2]},speed:1,elapsed:3,lastTime:1000,speedLabel:{string:'速度 ×1'}};
  a(cycle(v));a.equal(v.speed,2);a.equal(v.elapsed,4);a.equal(v.speedLabel.string,'速度 ×2');a(cycle(v));a.equal(v.speed,1);a.equal(v.elapsed,4);v.playing=false;a.equal(cycle(v),false);
 }finally{Date.now=original;}
});
