/** 屏外隔离模型与真实 Cocos 触摸绑定验收；不切换玩家页面或写入玩家存档。 */
(async function verifyRejectedDrop(){
 const g=GameGlobal[0],req=g.__wxRequire,sample=g.__sanguoPlay;if(!sample?.ready||req('./app-version').version!=='1.0.286')throw Error('请先编译并启动1.0.286');
 const {Expedition}=req('./expedition'),{ExpeditionView}=req('./expedition-view'),cc=sample.cc,model=new Expedition(sample.config,sample.roster,{read:()=>null,write(){}});req('./classic-hooks').attach(model,sample.roster);
 Object.assign(model.state.meta,{chapter:5,section:5,cleared:4,lord:'1002'});model.state.expedition.level=8;model.state.units=Array.from({length:60},(_,i)=>({uid:i+1,heroId:'xuchu',star:3,slot:i<8?i:-1}));model.state.nextUid=61;
 const original=JSON.stringify(sample.model.state),state=model.state,root=new cc.Node('isolated-deployment-286');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform);root.setPosition(10000,0,0);sample.view.root.addChild(root);
 const counts={renders:0,actions:0,transactions:0,writes:0,notices:0},v=Object.create(ExpeditionView.prototype);Object.assign(v,{cc,root,model,config:sample.config,roster:sample.roster,ui:sample.view.ui,actors:new Map(),playing:false,page:'battle',render(){counts.renders++;},act(){counts.actions++;throw Error('拒绝落子不应进入act');},notice(title,body){counts.notices++;if(body!==req('./deployment-config').full)throw Error(body);return ExpeditionView.prototype.notice.call(this,title,body);},slotAt:()=>8});
 const transact=model.transact.bind(model);model.transact=fn=>{counts.transactions++;return transact(fn);};model.storage.write=()=>{counts.writes++;};
 /** 真实节点派发触摸事件，模拟跨出原图标后在空格松手。 */
 function touch(x,y,code){return {propagationStopped:false,getUILocation:()=>({x,y}),getEventCode:()=>code};}
 try{
  const actor=v.drawFriendly(model.unit(9),0,-300,1),before=actor.node.getSiblingIndex(),events=cc.Node.EventType,start=Date.now();
  actor.node.emit(events.TOUCH_START,touch(0,-300));actor.node.emit(events.TOUCH_MOVE,touch(100,0));actor.node.emit(events.TOUCH_CANCEL,touch(100,0,'touch-end'));actor.node.emit(events.TOUCH_END,touch(100,0,'touch-end'));
  const report={version:req('./app-version').version,callMs:Date.now()-start,...counts,stateReferenceRetained:model.state===state,returnedToOrigin:actor.node.position.x===0&&actor.node.position.y===-300,siblingRestored:actor.node.getSiblingIndex()===before,actorRetained:actor.node.isValid,playerStateUnchanged:JSON.stringify(sample.model.state)===original};
  if(report.renders||report.actions||report.transactions||report.writes||report.notices!==1||!report.stateReferenceRetained||!report.returnedToOrigin||!report.siblingRestored||!report.actorRetained||!report.playerStateUnchanged)throw Error(JSON.stringify(report));g.__deployment286QA=report;console.log('DEPLOYMENT286 '+JSON.stringify(report));
 }catch(error){console.error('DEPLOYMENT286_FAILED '+String(error.stack||error));}finally{req('./deployment-view').clear(v);root.removeFromParent();root.destroy();}
})();

