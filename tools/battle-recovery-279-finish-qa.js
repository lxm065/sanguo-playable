/** 驱动真实控件回调验证领取与错误重试，结束时恢复玩家原画布且核对存档未变。 */
(function finishRecoveryQA(){
  const sample=GameGlobal[0].__sanguoPlay,req=GameGlobal[0].require,q=sample.recovery279QA,report={version:req('play/app-version.js').version};
  if(!q)throw Error('请先创建隔离验收场景');
  const {cc,config,roster}=sample,v=q.view;
  /** 复用真实按钮触摸回调，缺少入口直接判定验收失败。 */
  function click(label){const n=v.modal?.children.find(n=>n.name===label);if(!n)throw Error('没有找到按钮：'+label);n.emit(cc.Node.EventType.TOUCH_END,{propagationStopped:false});}
  try{
    const m=q.restored,before=q.before;click('选择');
    report.heroClaimed=!m.state.pending&&m.state.units.length===before.units.length+1&&m.state.gold===before.gold+before.pending.gold;
    report.heroOnlyOnce=m.claim(0)===false&&m.state.battles===1;
    const E=req('play/expedition.js').Expedition,attach=req('play/classic-hooks.js').attach;
    const elite=new E(config,roster,{read:()=>null,write:value=>q.storage.write(value)});attach(elite,roster);elite.deploy(elite.state.units[0].uid,0);
    elite.transact(()=>{const n=elite.progression.nodes().find(n=>n.type==='elite');elite.state.meta.activeNode=n.id;elite.state.meta.layer=n.row;});
    elite.simulator=()=>({result:'win',initial:[],final:[],events:[],duration:1});elite.fight();
    const restored=new E(config,roster,q.storage);attach(restored,roster);v.model=restored;v.progress=restored.progression;v.page='home';v.render();
    report.equipmentRestored=v.page==='battle'&&!!v.modal?.children.find(n=>n.name==='领取装备');
    const snapshot=JSON.stringify(restored.state);q.setFailure(true);click('领取装备');report.failedWritePreserved=JSON.stringify(restored.state)===snapshot&&!!v.modal?.getChildByName('notice');
    q.setFailure(false);click('关闭');report.closeRestoredReward=!!v.modal?.children.find(n=>n.name==='领取装备');
    const count=restored.state.expedition.equipment.length;click('领取装备');report.equipmentClaimed=!restored.state.pending&&restored.state.expedition.equipment.length===count+1;
    report.equipmentOnlyOnce=restored.claim()===false;
  }finally{
    q.setFailure(false);clearTimeout(v.warmTimer);req('play/battle-effects.js').clear(v);req('play/tutorial-view.js').cancel(v);q.root.destroy();
    q.children.forEach(({node,active})=>{if(node.isValid)node.active=active;});
    report.originalUnchanged=JSON.stringify(q.original.state)===q.originalState;delete sample.recovery279QA;
    req('play/audio-settings.js').get().setScene(sample.view.page==='battle'?'battle':sample.view.page==='map'?'map':'home');
  }
  report.passed=Object.entries(report).filter(([key])=>key!=='version').every(([,value])=>value===true);
  return JSON.stringify(report);
})()
