/** 用独立模型和屏外真实 Cocos 面板验收通用失败出口，不写玩家存档。 */
(function verifyUnchangedFailures(){
 const g=GameGlobal[0],req=g.__wxRequire,sample=g.__sanguoPlay;if(!sample?.ready||req('./app-version').version!=='1.0.287')throw Error('请先编译1.0.287');
 const cc=sample.cc,{Expedition}=req('./expedition'),{ExpeditionView}=req('./expedition-view'),{ClassicView}=req('./classic-view'),feedback=req('./action-feedback'),model=new Expedition(sample.config,sample.roster,{read:()=>null,write(){}});req('./classic-hooks').attach(model,sample.roster);
 Object.assign(model.state.meta,{chapter:5,section:5,cleared:4,lord:'1002'});model.state.expedition.level=8;model.state.units=Array.from({length:60},(_,i)=>({uid:i+1,heroId:i?'xuchu':'guanyu',star:3,slot:i<8?i:-1}));model.state.nextUid=61;model.state.gold=0;
 const originalPlayer=JSON.stringify(sample.model.state),root=new cc.Node('isolated-action-failure-287');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform);root.setPosition(10000,0,0);sample.view.root.addChild(root);
 const counts={renders:0,writes:0,notices:0},v=Object.create(ExpeditionView.prototype);Object.assign(v,{model,cc,root,ui:sample.view.ui,config:sample.config,roster:sample.roster,actors:new Map(),page:'battle',playing:false,render(){counts.renders++;feedback.rendered(this);},notice(title,body,options){counts.notices++;return ClassicView.prototype.notice.call(this,title,body,options);}});model.storage.write=()=>{counts.writes++;};
 const results=[];
 /** 真实关闭按钮派发事件，验证不会重建原面板或重复领奖。 */
 function close(){const button=v.modal.getChildByName('关闭');if(!button)throw Error('缺少关闭按钮');button.emit(cc.Node.EventType.TOUCH_END,{propagationStopped:false});}
 try{
  const actor=v.ui.actor(root,model.unit(1),0,0,1);v.actors.set(1,actor);const originalModal=v.overlay();v.ui.text(originalModal,'原操作面板',0,0,24,'#FFFFFF',400,40);
  const cases=[['金币不足',()=>model.refresh()],['合成材料不足',()=>model.merge(1)],['装备不存在',()=>model.equip(999,null)],['装备进阶等级过期',()=>req('./equipment-upgrades').upgrade(model,'7206',99)],['未完成日常',()=>model.activities.claim('missing')]];
  for(const [name,operation]of cases){feedback.rendered(v);const state=model.state,before=JSON.stringify(state),start=Date.now();v.act(operation);const callMs=Date.now()-start,preserved=v.modal!==originalModal&&originalModal.isValid&&model.state===state&&JSON.stringify(state)===before;close();results.push({name,callMs,stateAndModalRetained:preserved,closedToPrevious:v.modal===originalModal,actorRetained:v.actors.get(1)===actor&&actor.node.isValid});}
  model.state.pending={};feedback.rendered(v);v.act(()=>model.refresh());close();const pendingCloseNoRender=counts.renders===0&&v.modal===originalModal;model.state.pending=null;
  if(counts.renders||counts.writes||!pendingCloseNoRender||results.some(r=>!r.stateAndModalRetained||!r.closedToPrevious||!r.actorRetained))throw Error(JSON.stringify({counts,results,pendingCloseNoRender}));
  feedback.rendered(v);v.act(()=>model.transact(()=>{model.state.gold++;throw Error('已修改必须恢复');}));if(counts.renders!==1||model.state.gold!==0)throw Error('真实回滚未恢复重绘');
  const report={version:req('./app-version').version,cases:results,unchangedFailures:6,pendingCloseNoRender,rollbackRenders:counts.renders,writes:counts.writes,playerStateUnchanged:JSON.stringify(sample.model.state)===originalPlayer};g.__actionFailure287QA=report;console.log('ACTION_FAILURE287 '+JSON.stringify(report));
 }catch(error){console.error('ACTION_FAILURE287_FAILED '+String(error.stack||error));}finally{root.removeFromParent();root.destroy();}
})();
