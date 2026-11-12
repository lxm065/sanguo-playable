/** 在开发者工具控制台创建独立内存存档与画布，验证真实构造器的强退恢复。 */
(function setupRecoveryQA(){
  const sample=GameGlobal[0].__sanguoPlay,req=GameGlobal[0].require;
  if(sample.recovery279QA)throw Error('请先恢复已有验收场景');
  const {cc,config,roster,assets}=sample,original=sample.model,originalState=JSON.stringify(original.state);
  let saved,fail=false;
  const storage={read:()=>saved&&JSON.parse(JSON.stringify(saved)),write(value){if(fail)throw Error('验收模拟写盘失败');saved=JSON.parse(JSON.stringify(value));}};
  const E=req('play/expedition.js').Expedition,attach=req('play/classic-hooks.js').attach;
  const model=new E(config,roster,storage);attach(model,roster);model.deploy(model.state.units[0].uid,0);
  model.progression.enter(model.progression.nodes().find(n=>n.type==='battle'&&model.progression.accessible(n)).id);
  model.simulator=()=>({result:'win',initial:[],final:[],events:[],duration:1});model.fight();
  model.transact(()=>{model.state.pending.choices=['xuchu','xuchu','xuchu'];});
  const restored=new E(config,roster,storage);attach(restored,roster);
  const children=sample.view.root.children.map(node=>({node,active:node.active}));children.forEach(({node})=>{node.active=false;});
  const root=new cc.Node('recovery-279-qa');root.layer=sample.view.root.layer;root.addComponent(cc.UITransform).setContentSize(config.layout.width,config.layout.height);sample.view.root.addChild(root);
  const view=new(req('play/expedition-view.js').ExpeditionView)(cc,root,assets,restored,config,roster);
  sample.recovery279QA={view,root,children,original,originalState,restored,storage,setFailure(value){fail=value;},before:JSON.parse(JSON.stringify(restored.state))};
  view.page='map';view.render();
  return JSON.stringify({phase:'setup',version:req('play/app-version.js').version,page:view.page,pending:restored.state.pending.id,rewardVisible:!!view.modal?.getChildByName('expedition-reward'),selectionButtons:view.modal?.children.filter(n=>n.name==='选择').length,originalUnchanged:JSON.stringify(original.state)===originalState});
})()
