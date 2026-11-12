'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{fixture}=require('./profile-interaction-285.cjs'),feedback=require('../game/play/action-feedback'),transaction=require('../game/play/transaction-state');
const {ExpeditionView}=require('../game/play/expedition-view'),{ClassicView}=require('../game/play/classic-view'),{ChallengeView}=require('../game/play/challenge-view');
/** 每项使用独立真规则模型，所有写入计数都留在内存。 */
function model(){const m=fixture(24);m.state.gold=0;let writes=0;m.storage.write=()=>writes++;return {m,writes:()=>writes};}
/** 接入实际 act 与错误路由，UI 端口只统计重绘和是否保留底层弹窗。 */
function view(m,act=ExpeditionView.prototype.act){const calls={renders:0,notices:[]},v={model:m,roster:m.roster,page:'battle',actors:new Map(),playing:false,render(){calls.renders++;feedback.rendered(this);},notice(title,body,options){calls.notices.push({title,body,options});},act};feedback.rendered(v);return {v,calls};}
/** 同一矩阵覆盖不同真实领域入口，拒绝前不得改资源或丢失 UI 所持引用。 */
function cases(){return [
 ['随机刷新金币不足',m=>{},m=>m.refresh(),/不足/],
 ['三合一材料不足',m=>{m.state.units[0].heroId='zhugeliang';},m=>m.merge(1),/三名/],
 ['合成已达章节上限',m=>{m.state.units[0].star=m.maxRank();},m=>m.merge(1),/最高阶/],
 ['招募无效位置',m=>{},m=>m.recruit(999),/招募位置/],
 ['装备不存在',m=>{},m=>m.equip(999,null),/不存在/],
 ['武将第四件装备',m=>{m.state.expedition.equipment.slice(0,3).forEach(e=>e.owner=1);},m=>m.equip(18,1),/最多装备/],
 ['没有当前兵种奖励',m=>{},m=>m.refreshReward(),/没有兵种奖励/],
 ['福利视频凭据失效',m=>{m.state.meta.chapter=1;m.state.expedition.novice=0;},m=>m.claimNovice(null),/奖励已领取/],
 ['地图跨层不可进入',m=>{},m=>m.progression.enter('999-999'),/节点不存在|请从/],
 ['商人商品余额不足',m=>{m.state.meta.activeNode='merchant-test';m.state.meta.nodeEvent={kind:'merchant',node:'merchant-test',key:'test',bought:[],offers:[{kind:'experience',amount:1,price:100}]};},m=>m.nodeEvents.buy(0,'test'),/金币不足/],
 ['日常未达成',m=>{},m=>m.activities.claim('missing'),/未达成/],
 ['装备进阶预期等级过期',m=>{},m=>require('../game/play/equipment-upgrades').upgrade(m,'7206',99),/阶级已变化/],
 ];}
for(const [name,setup,operation,pattern]of cases())test(name+'：保留状态/弹窗，直接提示且不重绘、不写盘',()=>{
 const f=model();setup(f.m);const {v,calls}=view(f.m),state=f.m.state,units=state.units,unit=units[0],before=JSON.stringify(state);
 v.act(()=>operation(f.m));assert.equal(calls.renders,0);assert.equal(calls.notices.length,1);assert.match(calls.notices[0].body,pattern);assert.equal(calls.notices[0].options.preserve,true);assert.equal(f.m.state,state);assert.equal(f.m.state.units,units);assert.equal(f.m.state.units[0],unit);assert.equal(JSON.stringify(state),before);assert.equal(f.writes(),0);
});
test('发生真实修改或嵌套同值引用替换后失败，必须回滚并重建绑定',()=>{
 for(const change of [m=>m.state.gold++,m=>m.state.units=[...m.state.units],m=>m.state.units[0]={...m.state.units[0]},m=>m.state.meta={...m.state.meta}]){
  const f=model(),{v,calls}=view(f.m),state=f.m.state,snapshot=structuredClone(state);v.act(()=>f.m.transact(()=>{change(f.m);throw Error('需要回滚');}));assert.equal(calls.renders,1);assert.equal(calls.notices[0].options.preserve,false);assert.notEqual(f.m.state,state);assert.deepEqual(f.m.state,snapshot);assert.equal(f.writes(),0);
 }
});
test('合法操作写盘失败仍回滚；未知异常、先提交后失败和过期画布均不误跳过恢复',()=>{
 {const f=model(),{v,calls}=view(f.m),snapshot=structuredClone(f.m.state);f.m.storage.write=()=>{throw Error('磁盘已满');};v.act(()=>f.m.deploy(9,0));assert.deepEqual(f.m.state,snapshot);assert.equal(calls.renders,1);}
 {const f=model(),{v,calls}=view(f.m);v.act(()=>{throw Error('未知异常');});assert.equal(calls.renders,1);}
 {const f=model(),{v,calls}=view(f.m);v.act(()=>{f.m.transact(()=>f.m.state.gold++);f.m.refresh();});assert.equal(calls.renders,1);assert.equal(f.m.state.gold,1);assert.equal(f.writes(),1);}
 {const f=model(),{v,calls}=view(f.m);f.m.transact(()=>f.m.state.gold++);v.act(()=>f.m.refresh());assert.equal(calls.renders,1);}
 {const f=model(),{v,calls}=view(f.m);v.act(()=>{v.page='map';f.m.refresh();});assert.equal(calls.renders,1);}
});
test('最后武将遣返先卸装再拒绝，仍恢复装备归属并重绘',()=>{
 const f=model();f.m.state.units=[f.m.state.units[0]];f.m.state.expedition.equipment=[{uid:1,id:'7206',owner:1}];f.m.state.expedition.nextEquipment=2;const before=structuredClone(f.m.state),{v,calls}=view(f.m);v.act(()=>f.m.sell(1));assert.equal(calls.renders,1);assert.match(calls.notices[0].body,/至少保留/);assert.deepEqual(f.m.state,before);
});
test('未达成条件的活动/地图失败不额外写入历史成绩，成功跨章回退仍保留最高成绩',()=>{
 const f=model(),before=f.m.state.meta.friendRankBest,score=require('../game/play/friend-rank-metric').score(f.m.state.meta);assert.throws(()=>f.m.refresh());assert.equal(f.m.state.meta.friendRankBest,before);f.m.transact(()=>Object.assign(f.m.state.meta,{chapter:1,section:1,layer:0,cleared:0}));assert.equal(f.m.state.meta.friendRankBest,score);
});
test('保守开关能恢复失败重绘；错误凭据不在其他模型或稍后的版本之间通用',()=>{
 const c=require('../game/play/action-feedback-config'),old=c.retainUnchangedFailures;try{c.retainUnchangedFailures=false;const f=model(),{v,calls}=view(f.m);v.act(()=>f.m.refresh());assert.equal(calls.renders,1);}finally{c.retainUnchangedFailures=old;}
 const f=model(),scope=feedback.begin(f.m);let error;try{f.m.refresh();}catch(e){error=e;}assert(feedback.canRetain(f.m,error,scope));assert.equal(feedback.canRetain(model().m,error,scope),false);f.m.transact(()=>f.m.state.gold++);assert.equal(feedback.canRetain(f.m,error,scope),false);
});
test('Classic 动作及旧版入口沿用同一拒绝证明，云同步拦截不被通用错误覆盖',()=>{
 const f=model(),{v,calls}=view(f.m,ClassicView.prototype.act);v.act(()=>f.m.refresh());assert.equal(calls.renders,0);assert(calls.notices[0].options.preserve);
 const ui=require('../game/play/cloud-save-ui'),old=ui.handleError;let handled=0;try{ui.handleError=()=>{handled++;return true;};f.m.storage.assertWritable=()=>{throw Error('同步等待');};v.act(()=>f.m.refresh());assert.equal(calls.renders,0);assert.equal(calls.notices.length,1);assert.equal(handled,1);}finally{ui.handleError=old;}
});
test('保留模式关闭提示后回到原奖励/合成面板，不再次重绘或重新生成奖励',()=>{
 const title=require('../game/play/paper-title'),old=title.draw,closes=[];title.draw=()=>{};
 /** 仅模拟叠层销毁；原面板和错误面板的身份可以直接核对。 */
 function node(){return {isValid:true,addComponent(){},destroy(){this.isValid=false;}};}
 try{const original=node(),v={model:{state:{pending:{}}},modal:original,root:{},cc:{BlockInputEvents:class{}},ui:{box:()=>node(),text(){},button(parent,label,x,y,w,fn){closes.push(fn);}},paper:()=>node(),overlay:require('../game/play/view').PlayView.prototype.overlay,render(){throw Error('关闭保留提示不应重绘');}};
  ClassicView.prototype.notice.call(v,'提示','无法领取',{preserve:true});assert(original.isValid);assert.notEqual(v.modal,original);closes.pop()();assert.equal(v.modal,original);assert(original.isValid);
 }finally{title.draw=old;}
});
test('地图无效入口只移除正在进入文字，保留地图与滚动位置',async()=>{
 const f=model(),{v,calls}=view(f.m);v.page='map';v.mapOffset=-345;feedback.rendered(v);let removed=false;v.ui={text:()=>({node:{isValid:true,destroy(){removed=true;}}})};v.progress={enter:()=>f.m.transact(()=>{throw Error('不可到达');})};ClassicView.prototype.enterMapNode.call(v,'bad-node');await new Promise(resolve=>setTimeout(resolve,require('../game/play/loading-config').sliceDelay+15));assert.equal(calls.renders,0);assert(removed);assert.equal(v.mapOffset,-345);assert.equal(v.enteringMap,false);assert(calls.notices[0].options.preserve);
});
test('挑战刷新金币不足只更新提示，原棋盘和准备计时保持；真实回滚仍重建',()=>{
 const f=model();f.m.state.meta.unlocked=f.m.roster.filter(h=>!h.legacy).map(h=>h.id);const service=new(require('../game/play/challenge').Challenge)(f.m);service.initialize();service.start();service.state.run.players[0].gold=0;let renders=0,texts=0;const root={isValid:true},timer={},v={service,screen:'game',root,timer,actors:new Map(),ui:{text(parent,text){texts++;return {string:text,node:{isValid:true}};}},render(){renders++;},act:ChallengeView.prototype.act};feedback.rendered(v,f.m);
 v.act(()=>service.refresh());v.act(()=>service.refresh());assert.equal(renders,0);assert.equal(texts,1);assert.equal(v.root,root);assert.equal(v.timer,timer);assert.match(v.message,/金币不足/);v.act(()=>f.m.transact(()=>{f.m.state.gold++;throw Error('回滚');}));assert.equal(renders,1);
});
test('无修改识别会检查数组和所有嵌套对象引用，而非仅比较 JSON 字符串',()=>{
 const state={units:[{uid:1,star:3}],meta:{inventory:{a:1}}},snapshot=transaction.capture(state);assert(transaction.unchanged(state,snapshot));state.units[0]={...state.units[0]};assert.equal(transaction.unchanged(state,snapshot),false);assert.deepEqual(JSON.parse(JSON.stringify(state)),snapshot.value);
});

