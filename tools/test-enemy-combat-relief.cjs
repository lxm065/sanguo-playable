'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),relief=require('../game/play/enemy-relief'),skills=require('../game/play/hero-skills');
/** 创建可序列化的章节援助状态，用于验证视频次数及跨关恢复。 */
function state(chapter){return {meta:{chapter,section:2,activeNode:'a'},expedition:{difficultyCycle:{chapter},enemyEncounter:{retries:1}}};}
test('援助按章节胜场渐退，失败读档不变，新广告不会抬高机制难度',()=>{
 for(const chapter of [1,4]){const s=state(chapter),steps=chapter===1?3:2;
 relief.grant(s);assert.equal(relief.snapshot(s).healing,.8);
 assert.deepEqual(relief.snapshot(JSON.parse(JSON.stringify(s))),relief.snapshot(s));
 s.expedition.enemyEncounter.retries=3;relief.grant(s);assert.equal(relief.snapshot(s).healing,.4);
 relief.win(s);assert(relief.snapshot(s).healing>.4);assert(relief.snapshot(s).healing<1);
 for(let n=1;n<steps;n++)relief.win(s);assert.equal(relief.snapshot(s).healing,1);
 }
});
test('首战重复敌方钩人分批开场，我方冷却不变',()=>{
 const make=(side,uid)=>({side,uid,heroId:'zhangfei',skills:[{id:'12091',cooldown:10}],attack:10,nextSkill:0,reduction:0,interval:1});
 const units=[make('enemy',-1),make('enemy',-2),make('enemy',-3),make('ally',1),make('ally',2)];skills.initialize(units);relief.stagger(units);
 assert.deepEqual(units.map(u=>u.skillTimers['12091']),[0,3,6,0,0]);
});
test('敌方冷却与控制援助不改变玩家或全局技能配置',()=>{
 const units=['enemy','ally'].map((side,i)=>({side,uid:i,heroId:'zhenji',skills:[{id:'11021',cooldown:7}],attack:10,nextSkill:7,reduction:0,interval:1,combatRelief:side==='enemy'?relief.factors(3,1):null}));
 skills.initialize(units);assert.equal(units[0].nextSkill,10.5);assert.equal(units[1].nextSkill,7);
 assert.equal(relief.duration(units[0],5),3);assert.equal(relief.duration(units[1],5),5);
});
test('所有章节所有阶段的视频入口均授予援助，普通重试不授予',()=>{
 const budget=require('../game/play/enemy-budget');
 for(const chapter of [1,2,3,4,5,6,7,8,18])for(let section=1;section<=5;section++)for(const type of ['battle','elite','boss']){
  const s=state(chapter);s.meta.section=section;s.meta.activeNode=type;delete s.expedition.difficultyCycle;
  s.expedition.enemyEncounter={key:budget.key(s),retries:0};const model={state:s,progression:{nodes:()=>[{id:type,type}]}};
  budget.assist(model,false);assert.equal(relief.snapshot(s),null);
  budget.assist(model,true);assert.equal(relief.snapshot(s).healing,.8);
  budget.assist(model,true);assert.equal(relief.snapshot(s).healing,.6);
  budget.assist(model,true);assert.equal(relief.snapshot(s).healing,.4);
  relief.settle(model,{battle:{result:'loss'}});assert.equal(relief.snapshot(s).healing,.4);
  relief.settle(model,{training:true,battle:{result:'win'}});assert.equal(relief.snapshot(s).healing,.4);
  relief.settle(model,{battle:{result:'win'}});assert(relief.snapshot(s).healing>.4);
  assert.equal(s.expedition.difficultyCycle,undefined,'保护期不能提前建立战力基准');
 }
});
test('旧援助迁移、阶段切换及恢复耗尽不会重复减难',()=>{
 const s=state(4);s.expedition.difficultyCycle.combatRelief={count:3,steps:2,remaining:2};
 assert.equal(relief.snapshot(s).healing,.4);relief.win(s);assert.equal(relief.snapshot(s).healing,.7);
 s.meta.section=3;assert.equal(relief.snapshot(s).healing,.7);relief.win(s);assert.equal(relief.snapshot(s).healing,1);
 s.meta.chapter=5;assert.equal(relief.snapshot(s),null);
});
