'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),{performance}=require('node:perf_hooks'),{fixture}=require('./profile-interaction-285.cjs');
const {ExpeditionView}=require('../game/play/expedition-view'),legacy=require('../dist/wechat-1.0.285-final/play/campaign').Campaign.prototype.deploy,drop=require('../game/play/deployment-drop');
/** 用旧开发包的实际部署函数与当前函数比较；重绘端口仅执行真实敌阵预览查询。 */
function measure(old){const model=fixture(60),counts={transactions:0,writes:0,renders:0,notices:0},transact=model.transact.bind(model),samples=[];
 model.storage.write=()=>counts.writes++;model.transact=fn=>{counts.transactions++;return transact(fn);};if(old)model.deploy=legacy;
 const view={model,roster:model.roster,config:model.rules,actors:new Map(),slotAt:()=>8,render(){counts.renders++;model.enemies();},notice(){counts.notices++;},act:ExpeditionView.prototype.act},actor={node:{isValid:true,setPosition(){},setSiblingIndex(){}}};
 model.enemies();const state=model.state,snapshot=JSON.stringify(state);
 for(let i=0;i<5;i++){const start=performance.now();if(old)view.act(()=>model.deploy(9,8));else drop.submit(view,actor,9,{x:0,y:0},{x:0,y:-300,sibling:0});samples.push(performance.now()-start);}
 assert.equal(JSON.stringify(model.state),snapshot);return {medianMs:+samples.sort((a,b)=>a-b)[2].toFixed(3),...counts,stateReferenceRetained:model.state===state};
}
const result={environment:'Node synthetic 60 heroes, 8/8 deployed; renderer port runs enemy preview only, not device latency',before:measure(true),after:measure(false)};
assert.equal(result.after.transactions,0);assert.equal(result.after.renders,0);assert.equal(result.after.writes,0);assert.equal(result.after.notices,5);assert(result.after.stateReferenceRetained);
fs.writeFileSync('evidence/deployment-286-benchmark.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result,null,2));
