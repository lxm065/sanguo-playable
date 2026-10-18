'use strict';
const test=require('node:test'),a=require('node:assert/strict'),cycle=require('../game/play/enemy-difficulty-cycle'),light=require('../game/play/enemy-light-balance'),budget=require('../game/play/enemy-budget');
/** 构造已锁定的Boss预算，100基准、2倍难度、最近通关系数1.5。 */
function model(chapter,type=1.35){
 const state={meta:{chapter,section:5,activeNode:'boss'},expedition:{difficultyCycle:{chapter,baseline:100,difficulty:2,lastClearedDifficulty:1.5,growthStep:.04,videoReliefs:0,wins:0}}};
 state.expedition.enemyEncounter={key:budget.key(state),scale:2*type,lightBalance:{version:8,own:100,enemy:100,type,difficulty:2,curve:2*type,scale:2*type,legacyRetries:0,legacyContinues:0}};
 return {state,rules:{},progression:{nodes:()=>[{id:'boss',type:'boss'}]}};
}
/** 浮点预算仅容许计算舍入误差。 */
function near(x,y){a(Math.abs(x-y)<1e-9,`${x} != ${y}`);}
test('第一至八章三种关卡首次视频均回150，后续按章节乘0.8或0.85，读档保持',()=>{
 for(let chapter=1;chapter<=8;chapter++)for(const type of [1.05,1.2,1.35]){
  const m=model(chapter,type),e=m.state.expedition.enemyEncounter,v=cycle.current(m.state),rate=chapter<=3?.8:.85;
  a(light.assist(m,true));near(e.lightBalance.curve*100,150);near(e.scale,1.5);near(v.recoveryTarget,2);
  for(let n=1;n<=3;n++){a(light.assist(m,true));near(e.lightBalance.curve*100,150*rate**n);near(e.scale,1.5*rate**n);}
  const saved=JSON.stringify(m.state);cycle.initialize(m.state,100);near(e.lightBalance.curve*100,150*rate**3);a.equal(JSON.stringify(m.state),saved);
  const before=e.scale;a(light.assist(m,false));a.equal(e.scale,before);
 }
});
test('连续减难后前三章三次、后续两次精确恢复原Boss失败目标270，不提早跳回',()=>{
 for(let chapter=1;chapter<=8;chapter++){
  const m=model(chapter),e=m.state.expedition.enemyEncounter,v=cycle.current(m.state),steps=chapter<=3?3:2;
  light.assist(m,true);light.assist(m,true);const start=e.lightBalance.curve*100;
  for(let i=1;i<=steps;i++){
   cycle.settle(m,{battle:{result:'win'}});e.lightBalance.difficulty=v.difficulty;e.lightBalance.curve=v.difficulty*e.lightBalance.type;
   near(e.lightBalance.curve*100,start+(270-start)*i/steps);
  }
  near(e.lightBalance.curve*100,270);
 }
});
test('旧广告折扣低于通关A时继续降低，不能回调抬高当前强度',()=>{
 const m=model(1),e=m.state.expedition.enemyEncounter,v=cycle.current(m.state);v.difficulty=.5;e.scale=.675;
 light.assist(m,true);near(e.scale,.675*.8);near(v.recoveryTarget,.5);
});
