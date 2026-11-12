'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const {Expedition}=require('../game/play/expedition'),{ExpeditionView}=require('../game/play/expedition-view');
const {attach}=require('../game/play/classic-hooks');
const rules=require('../game/play/config'),roster=require('../game/play/expedition-roster'),recovery=require('../game/play/battle-recovery');

/** 用真实战果事务和隔离存储模拟强退，重载始终读取最后成功提交的快照。 */
function fixture({result='win',type='battle',hp=3,chapter=1,section=1,training=false}={}){
  let saved,fail=false,writes=0;
  const storage={read:()=>saved&&structuredClone(saved),write(value){if(fail)throw Error('写盘失败');saved=structuredClone(value);writes++;}};
  const m=new Expedition(rules,roster,storage);attach(m,roster);
  m.deploy(m.state.units[0].uid,0);
  m.transact(()=>{Object.assign(m.state.meta,{chapter,section,hp,cleared:chapter-1});const n=m.progression.nodes().find(n=>n.type===type);m.state.meta.activeNode=n.id;m.state.meta.layer=n.row;});
  m.simulator=()=>({result,initial:[],final:[],events:[],duration:1});m.fight(training);
  if(m.state.pending.rewardKind==='heroes')m.transact(()=>{m.state.pending.choices=['xuchu','xuchu','xuchu'];});
  return {m,storage,reload(){const restored=new Expedition(rules,roster,storage);attach(restored,roster);return restored;},fail(value){fail=value;},saved:()=>structuredClone(saved),writes:()=>writes};
}

/** 最小场景记录真实奖励按钮和弹窗生命周期，省略与恢复无关的棋盘绘制。 */
function scene(model,page='home'){
  function node(parent,name){const n={name,parent,children:[],isValid:true,events:{},on(type,callback){this.events[type]=callback;},addComponent(){return new Proxy({},{get:(o,k)=>o[k]??(()=>{})});},setSiblingIndex(){},removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(c=>c!==this);},destroy(){this.isValid=false;this.removeFromParent();}};parent?.children.push(n);return n;}
  const root=node(null,'root'),ui={node,box:node,image:node,portrait:node,actor:node,text(parent,string){return {string,node:node(parent,String(string))};},button(parent,label,x,y,width,action){const n=node(parent,label);n.click=action;return n;}};
  const v=Object.assign(Object.create(ExpeditionView.prototype),{model,progress:model.progression,roster,config:rules,root,ui,page,actors:new Map(),cc:{Node:{EventType:{TOUCH_END:'end'}},Color:class{},LabelOutline:class{},BlockInputEvents:class{}},renderBattle(){this.reward();},renderHome(){},renderHeader(){},renderTabs(){}});
  v.find=function find(name,parent=root){for(const n of parent.children){if(n.name===name)return n;const child=find(name,n);if(child)return child;}return null;};
  return v;
}

test('强退重进自动显示同一组选将，浏览恢复不发奖、不写盘、不重算战斗',()=>{
  const f=fixture(),m=f.reload(),v=scene(m),before=JSON.stringify(m.state),writes=f.writes();
  m.simulator=()=>{throw Error('恢复不能重新模拟战斗');};v.render();
  a.equal(v.page,'battle');a(v.find('expedition-reward'));a(v.find('选择'));a.equal(JSON.stringify(m.state),before);a.equal(f.writes(),writes);
  const count=m.state.units.length,gold=m.state.gold,p=structuredClone(m.state.pending);
  v.find('选择').click();a.equal(m.state.pending,null);a.equal(m.state.units.length,count+1);a.equal(m.state.gold,gold+p.gold);a.equal(m.state.battles,1);a.equal(m.state.wins,1);
  const after=JSON.stringify(m.state);a.equal(m.claim(0),false);a.equal(JSON.stringify(m.state),after);a.equal(f.reload().state.pending,null);
});

test('已卡住的地图入口直接恢复奖励，不再次进入节点或弹出阻挡提示',()=>{
  const m=fixture().reload(),v=scene(m,'map'),before=JSON.stringify(m.state);
  m.progression.enter=()=>{throw Error('不应重复进入地图节点');};v.enterMapNode('0-1');
  a.equal(v.page,'battle');a(v.find('选择'));a.equal(v.find('notice'),null);a.equal(v.enteringMap,undefined);a.equal(JSON.stringify(m.state),before);
});

test('领取写盘失败后关闭错误提示重新展示战果，可重试且只入账一次',()=>{
  const f=fixture({type:'elite'}),m=f.reload(),v=scene(m),before=JSON.stringify(m.state);v.render();f.fail(true);
  v.find('领取装备').click();a(v.find('notice'));a.equal(JSON.stringify(m.state),before);a.deepEqual(f.saved(),JSON.parse(before));
  v.find('关闭').click();a(v.find('领取装备'));a.equal(v.find('notice'),null);
  f.fail(false);const count=m.state.expedition.equipment.length;v.find('领取装备').click();a.equal(m.state.expedition.equipment.length,count+1);a.equal(m.state.pending,null);a.equal(m.claim(),false);
});

test('恢复战败领取只扣一次生命，平局和演武也能继续',()=>{
  for(const options of [{result:'loss'},{result:'draw'},{training:true}]){
    const f=fixture(options),m=f.reload(),v=scene(m),before=m.state.meta.hp;v.render();
    const button=v.find(options.result==='loss'?require('../game/play/defeat-config').continue:'继续');a(button);if(button.click)button.click();else button.events.end({});
    a.equal(m.state.pending,null);a.equal(m.state.battles,1);a.equal(m.state.meta.hp,before-(options.training?0:1));a.equal(m.claim(),false);
  }
});

test('章末强退自动接续通关奖励，重复恢复不提前领取永久奖励',()=>{
  const f=fixture({type:'boss',chapter:2,section:5}),m=f.reload(),v=scene(m),diamonds=m.state.meta.diamonds;
  v.renderHome=function(){this.homeRendered=true;};v.render();
  a.equal(m.state.pending,null);a.equal(v.page,'home');a.equal(v.homeRendered,true);a.equal(m.state.meta.sectionReward.key,'2-5');a.equal(m.state.meta.diamonds,diamonds);
  const before=JSON.stringify(m.state);a.equal(recovery.resume(v),false);a.equal(JSON.stringify(m.state),before);
});

test('恢复策略不打断回放或开场，未领取时任何宿主页都会返回奖励',()=>{
  const m=fixture().reload();
  for(const page of ['home','map','heroes','camp','training']){const v={model:m,page};a.equal(recovery.resume(v),true);a.equal(v.page,'battle');}
  for(const flag of ['playing','startingBattle']){const v={model:m,page:'map',[flag]:true};a.equal(recovery.resume(v),false);a.equal(v.page,'map');}
  const policy=require('../game/play/expedition-config').pendingRewards,enabled=policy.resumeOnRender;
  try{policy.resumeOnRender=false;const v={model:m,page:'home'};a.equal(recovery.resume(v),false);a.equal(v.page,'home');}finally{policy.resumeOnRender=enabled;}
  m.claim(0);const v={model:m,page:'map'};a.equal(recovery.resume(v),false);a.equal(v.page,'map');
});

test('过期提示的关闭回调不能销毁当前奖励弹窗',()=>{
  const m=fixture().reload(),v=scene(m);v.render();v.notice('提示','写盘失败');const stale=v.find('关闭');
  v.render();const current=v.modal;stale.click();a.equal(v.modal,current);a.equal(current.isValid,true);a(v.find('选择'));
});
