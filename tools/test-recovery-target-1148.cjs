'use strict';
const test=require('node:test'),a=require('node:assert/strict'),cycle=require('../game/play/enemy-difficulty-cycle'),c=require('../game/play/enemy-light-balance-config');
/** 独立本局状态，节点依赖用于真实循环服务的胜利结算。 */
function model(){const state={meta:{chapter:3,section:2,activeNode:'battle'},expedition:{}};cycle.initialize(state,100);return {state,progression:{nodes:()=>[{id:'battle',type:'battle'}]}};}
/** 验证浮点目标和步长时容忍尾数误差。 */
function near(actual,expected){a(Math.abs(actual-expected)<1e-9,`${actual} != ${expected}`);}
test('117.6失败后连续视频退至86.4，三次增幅仍回117.6',()=>{const m=model(),v=cycle.current(m.state);v.lastClearedDifficulty=1.08;v.difficulty=1.12;cycle.relieve(m.state,c.types.battle);near(v.difficulty*105,108);cycle.relieve(m.state,c.types.battle);near(v.difficulty*105,86.4);near(v.recoveryTarget*105,117.6);for(const target of [96.8,107.2,117.6]){cycle.settle(m,{battle:{result:'win'}});near(v.difficulty*105,target);}});
test('降低后的恢复目标重载跨阶段不丢失，途中再失败不下调目标',()=>{const m=model(),v=cycle.current(m.state);v.lastClearedDifficulty=1.08;v.difficulty=1.12;cycle.relieve(m.state);cycle.relieve(m.state);const n={...m,state:structuredClone(m.state)};n.state.meta.section=3;cycle.settle(n,{battle:{result:'win'}});const before=cycle.current(n.state).difficulty;cycle.relieve(n.state);near(cycle.current(n.state).recoveryTarget,1.12);a(cycle.current(n.state).difficulty<before);});
test('突破旧失败目标后，新失败点成为更高目标，新章清除旧目标',()=>{const m=model(),v=cycle.current(m.state);v.recoveryTarget=1.12;v.lastClearedDifficulty=1.16;v.difficulty=1.20;cycle.relieve(m.state);near(v.recoveryTarget,1.20);near(v.growthStep,(1.20-1.16)/c.recoveryWins);m.state.meta.chapter=6;const next=cycle.initialize(m.state,200);a.equal(next.recoveryTarget,undefined);});
