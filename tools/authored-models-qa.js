// 仅在临时展示层验证引擎解析和动作播放，保存并复核玩家存档快照。
return (async()=>{
 const ids=['taishici','ganning','zhangjiao','yanliang'],before=JSON.stringify(model.state),results=[];
 if(sample.authoredQA?.node?.isValid)sample.authoredQA.node.destroy();
 const node=view.ui.box(view.root,'authored-models-qa',0,0,712,1220,'#252C30');
 sample.authoredQA={node,before};view.ui.text(node,'四将模型 · 引擎实测',0,538,34,'#ECD99D',680);
 for(const [i,id] of ids.entries()){
  const data=await sample.assets.skeleton(id),hero=roster.find(h=>h.id===id),x=i%2?175:-175,y=i<2?185:-285;
  if(!sample.assets.hasModel(id)||!data.getRuntimeData())throw Error('模型未接入 '+id);
  const actor=view.ui.actor(node,{uid:9900+i,heroId:id,star:hero.tier,side:'ally'},x,y,1.65,false);
  await sample.assets.assembly.run(()=>{});
  const actions=Object.keys(data.skeletonJson.animations);
  // 独立 Spine 组件遍历全部动画，验证游戏引擎能真正创建各动作。
  const probe=new cc.Node('animation-probe');node.addChild(probe);const sp=probe.addComponent(cc.sp.Skeleton);sp.skeletonData=data;
  for(const action of actions)if(!sp.setAnimation(0,action,false))throw Error('动作缺失 '+id+' '+action);
  probe.destroy();actor.facing='se';actor.updateLayout();view.ui.animate(actor,'idle',true);
  view.ui.text(node,hero.name,x,y+225,32,'#ECD99D',300);
  view.ui.text(node,'五套动作 · 八向显示',x,y-110,22,'#DBE1D8',315);
  results.push({id,loaded:true,actions:actions.length,textures:data.textureNames.length});
 }
 if(JSON.stringify(model.state)!==before)throw Error('玩家状态被改变');
 return {results,playerStateUnchanged:true};
})();
