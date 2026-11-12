'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./profile-interaction-285.cjs'),drop=require('../game/play/deployment-drop'),reference=require('../game/play/strongest-team');
/** 满八人及大量备战卡的独立内存档，计数器只观察本测试产生的事务与落盘。 */
function model(){const m=fixture(60),calls={transactions:0,writes:0},transact=m.transact.bind(m);m.transact=fn=>{calls.transactions++;return transact(fn);};m.storage.write=()=>{calls.writes++;};return {m,calls};}
/** 以真实规则校验落点，用可观察的节点端口检查回位和层级恢复。 */
function view(){const {m,calls}=model(),notices=[],actor={node:{isValid:true,position:{x:123,y:456},sibling:20,setPosition(x,y){this.position={x,y};},setSiblingIndex(i){this.sibling=i;}}},v={model:m,config:m.rules,slotAt:()=>8,render(){calls.renders=(calls.renders||0)+1;},act(fn){calls.actions=(calls.actions||0)+1;fn();this.render();},notice(title,body){notices.push({title,body});}};return {m,calls,notices,actor,v,origin:{x:0,y:-300,sibling:5}};}
test('满员拒绝在事务前完成，保留状态引用、阵容缓存和全部资源，不写盘',()=>{
 const {m,calls}=model(),state=m.state,units=state.units,unit=m.unit(9),before=JSON.stringify(state),cached=reference.query(state,m.rules);
 for(let i=0;i<20;i++)assert.throws(()=>m.deploy(9,8),/上阵人数已满/);
 assert.equal(m.state,state);assert.equal(m.state.units,units);assert.equal(m.unit(9),unit);assert.equal(JSON.stringify(state),before);assert.equal(reference.query(state,m.rules),cached);assert.deepEqual(calls,{transactions:0,writes:0});
});
test('满员仍可与场上武将交换、场内移空格及下阵，空出人口后允许上场',()=>{
 const {m,calls}=model();m.deploy(9,0);assert.equal(m.unit(1).slot,-1);assert.equal(m.unit(9).slot,0);m.deploy(2,8);assert.equal(m.unit(2).slot,8);m.deploy(3,-1);m.deploy(10,9);assert.equal(m.unit(10).slot,9);assert.equal(m.state.units.filter(u=>u.slot>=0).length,8);assert.equal(calls.writes,4);assert(m.valid(m.state));
});
test('越界、无效UID和待领战果同样在事务前拒绝；人口实时读取等级',()=>{
 const {m,calls}=model(),state=m.state;for(const slot of [-2,18,1.5,null,NaN])assert.throws(()=>m.deploy(9,slot),/己方棋盘/);assert.throws(()=>m.deploy(999,0),/请先选择/);m.state.pending={};assert.throws(()=>m.deploy(9,8),/先领取/);m.state.pending=null;assert.equal(m.state,state);assert.equal(calls.transactions,0);m.state.expedition.level++;m.deploy(9,8);assert.equal(m.unit(9).slot,8);assert.equal(calls.writes,1);
});
test('合法落子写盘失败依然回滚，失效会话优先拦截且不启动事务',()=>{
 const {m,calls}=model(),before=structuredClone(m.state);m.storage.write=()=>{throw Error('磁盘已满');};assert.throws(()=>m.deploy(9,0),/磁盘/);assert.deepEqual(m.state,before);calls.transactions=0;m.storage.assertWritable=()=>{throw Object.assign(Error('租约失效'),{code:'CLOUD_SAVE_BLOCKED'});};const state=m.state;assert.throws(()=>m.deploy(9,8),/租约/);assert.equal(calls.transactions,0);assert.equal(m.state,state);
});
test('满员拖拽直接回位并提示，不进入通用act、重绘或写盘，关闭后节点仍可复用',()=>{
 const f=view(),state=f.m.state;assert.equal(drop.submit(f.v,f.actor,9,{x:0,y:0},f.origin),false);assert.equal(f.notices.length,1);assert.match(f.notices[0].body,/上阵人数已满/);assert.deepEqual(f.actor.node.position,{x:0,y:-300});assert.equal(f.actor.node.sibling,5);assert.equal(f.calls.actions,undefined);assert.equal(f.calls.renders,undefined);assert.equal(f.calls.writes,0);assert.equal(f.m.state,state);assert.equal(f.actor.node.isValid,true);f.v.slotAt=()=>0;assert.equal(drop.submit(f.v,f.actor,9,{x:0,y:0},f.origin),true);assert.equal(f.calls.writes,1);assert.equal(f.calls.renders,1);
});
test('无效区域快速回位，备战席正常下阵；云同步错误仍走专用处理',()=>{
 const f=view();f.v.slotAt=()=>null;assert.equal(drop.submit(f.v,f.actor,9,{x:0,y:10000},f.origin),false);assert.match(f.notices[0].body,/请放在/);assert.equal(f.calls.transactions,0);const y=(f.v.config.layout.benchDropTop+f.v.config.layout.benchDropBottom)/2;assert.equal(drop.submit(f.v,f.actor,1,{x:0,y},f.origin),true);assert.equal(f.m.unit(1).slot,-1);
 const ui=require('../game/play/cloud-save-ui'),previous=ui.handleError,seen=[];try{ui.handleError=(v,e)=>{seen.push(e.code);return true;};f.m.storage.assertWritable=()=>{throw Object.assign(Error('同步等待'),{code:'CLOUD_SYNC_WAIT'});};assert.equal(drop.submit(f.v,f.actor,9,{x:0,y:0},f.origin),false);assert.deepEqual(seen,['CLOUD_SYNC_WAIT']);assert.equal(f.notices.length,1);assert.equal(f.calls.writes,1);}finally{ui.handleError=previous;}
});
/** 使用真实拖拽绑定触发松手和图标外释放，保留多监听器及冒泡行为。 */
function gesture(){const f=view(),handlers={},node=f.actor.node;node.on=(name,fn)=>(handlers[name]??=[]).push(fn);node.getSiblingIndex=()=>node.sibling;const v=f.v;Object.assign(v,{actors:new Map(),root:{children:Array(20).fill({}),getComponent:()=>({convertToNodeSpaceAR:p=>p})},cc:{Node:{EventType:{TOUCH_START:'start',TOUCH_MOVE:'move',TOUCH_END:'end',TOUCH_CANCEL:'cancel'}},UITransform:class{},Vec3:class{constructor(x,y){Object.assign(this,{x,y});}}},ui:{actor:()=>f.actor},playing:false});require('../game/play/expedition-view').ExpeditionView.prototype.drawFriendly.call(v,f.m.unit(9),f.origin.x,f.origin.y,1);return {...f,fire(name,event){for(const fn of handlers[name]||[])fn(event);}};}
/** 触摸坐标以场景转换后的值注入，不涉及真实玩家窗口。 */
function event(x,y,code){return {propagationStopped:false,getUILocation:()=>({x,y}),getEventCode:()=>code};}
test('真实拖拽绑定的满员松手仅提示一次，图标外释放同样快速拒绝',()=>{
 const hints=require('../game/play/deployment-view'),show=hints.show,clear=hints.clear;try{hints.show=()=>{};hints.clear=()=>{};for(const release of ['end','cancel']){const f=gesture();f.fire('start',event(0,-300));f.fire('move',event(100,0));assert.deepEqual(f.actor.node.position,{x:100,y:0});const e=event(100,0,'touch-end');f.fire(release,e);f.fire('end',e);assert.equal(f.notices.length,1);assert(e.propagationStopped);assert.deepEqual(f.actor.node.position,{x:0,y:-300});assert.equal(f.calls.transactions,0);assert.equal(f.calls.renders,undefined);}}finally{hints.show=show;hints.clear=clear;}
});

