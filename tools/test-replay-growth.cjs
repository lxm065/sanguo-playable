'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),cycle=require('../game/play/enemy-difficulty-cycle'),config=require('../game/play/enemy-win-growth-config');
/** 构造已解锁地图与可连续领奖的最小战斗上下文。 */
function model(chapter,cleared){const state={meta:{chapter,cleared,section:2,activeNode:'a'},expedition:{}};cycle.initialize(state,100);return {state,rules:{maxBattleSeconds:60},progression:{nodes:()=>[{id:'a',type:'battle'}]}};}
const win={battle:{result:'win',duration:1,initial:[{uid:1,side:'ally',hp:100}],final:[{uid:1,side:'ally',hp:100}]}};
test('已通关章节重玩20连胜仍固定最低增长，读档继续有效',()=>{
 for(const chapter of [1,3,4,8,18]){const m=model(chapter,chapter);for(let i=1;i<=20;i++){cycle.settle(m,win);assert(Math.abs(cycle.current(m.state).difficulty-(1+i*config.replay.step))<1e-9);m.state=JSON.parse(JSON.stringify(m.state));}assert.equal(cycle.current(m.state).lastGrowth.kind,'replay');}
});
test('未通关章节重新开始仍使用正常连胜加速',()=>{const m=model(4,3);for(let i=0;i<6;i++)cycle.settle(m,win);assert.equal(cycle.current(m.state).lastGrowth.kind,'streak');});
test('重玩视频回调后慢速恢复，失败训练均不增长',()=>{
 const m=model(8,8),v=cycle.current(m.state);v.difficulty=2;v.lastClearedDifficulty=1.5;cycle.relieve(m.state,1.35);const start=v.difficulty;
 cycle.settle(m,{battle:{result:'loss'}});cycle.settle(m,{...win,training:true});assert.equal(v.difficulty,start);
 cycle.settle(m,win);assert(Math.abs(v.difficulty-start-config.replay.step)<1e-9);assert.equal(v.recoveryTarget,2);
});
