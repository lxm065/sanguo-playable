'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks'),{fixture}=require('./profile-interaction-285.cjs');
const current=require('../game/play/expedition-view').ExpeditionView.prototype.act,oldAct=require('../dist/wechat-1.0.286/play/expedition-view').ExpeditionView.prototype.act,oldTransact=require('../dist/wechat-1.0.286/play/expedition').Expedition.prototype.transact;
/** 实际旧包和当前实现比较，渲染替身只执行敌阵预览，不计 Cocos/GPU 绘制。 */
function failures(legacy){const model=fixture(60),calls={renders:0,writes:0,notices:0},samples=[];model.state.gold=0;model.storage.write=()=>calls.writes++;if(legacy)model.transact=oldTransact;
 const v={model,roster:model.roster,page:'battle',actors:new Map(),act:legacy?oldAct:current,render(){calls.renders++;model.enemies();},notice(){calls.notices++;}};model.enemies();const state=model.state;
 for(let i=0;i<5;i++){const t=performance.now();v.act(()=>model.refresh());samples.push(performance.now()-t);}return {medianMs:+samples.sort((a,b)=>a-b)[2].toFixed(3),stateReferenceRetained:state===model.state,...calls};
}
/** 正常提交循环独立测量快照记录成本，确认优化未给成功操作增加长任务。 */
function successful(legacy,pending){const m=fixture(60);if(pending)m.fight();if(legacy)m.transact=oldTransact;m.storage.write=()=>{};const samples=[];for(let i=0;i<100;i++){const t=performance.now();m.transact(()=>m.state.gold++);if(i>=20)samples.push(performance.now()-t);}return {medianMs:+samples.sort((a,b)=>a-b)[40].toFixed(3),samples:80};}
const result={environment:'Node synthetic 60 heroes / 18 equipment; not phone latency',failedRefresh:{before:failures(true),after:failures(false)},successfulTransaction:{before:successful(true,false),after:successful(false,false)},transactionWithBattleReport:{before:successful(true,true),after:successful(false,true)}};assert.equal(result.failedRefresh.after.renders,0);assert.equal(result.failedRefresh.after.writes,0);assert.equal(result.failedRefresh.after.notices,5);fs.writeFileSync('evidence/action-failure-287-benchmark.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
