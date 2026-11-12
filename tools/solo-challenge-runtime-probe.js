'use strict';
/** 微信真实引擎隔离验收；不写玩家存档，不改云端经济和章节。 */
async function start(api,runID){
 const fs=api.getFileSystemManager(),base=api.env.USER_DATA_PATH+'/quiet-'+runID,report={runID,phase:'waiting-ready',screens:[]};let sample,root,host,view;
 /** 只保存验收布尔值、异常与截图，不输出玩家状态。 */
 function persist(){fs.writeFileSync(base+'.json',JSON.stringify(report,null,2),'utf8');}
 /** 等待真实引擎启动，超时留下失败证据。 */
 async function until(check){const end=Date.now()+120000;while(!check()){if(Date.now()>end)throw Error('引擎启动超时');await new Promise(resolve=>setTimeout(resolve,100));}}
 /** 在绘制完成后截图，避免导出空白WebGL缓冲。 */
 async function capture(name){report.phase=name;report.nativeInspection=true;persist();await new Promise(resolve=>setTimeout(resolve,100));}

 /** 按真实按钮事件调用，不直接伪造点击后的界面状态。 */
 function tap(name){const node=view.root.children.find(n=>n.name===name);if(!node)throw Error('缺少按钮 '+name);node.emit(sample.cc.Node.EventType.TOUCH_END,{propagationStopped:false});}
 persist();try{
  await until(()=>globalThis.__sanguoPlay?.ready);sample=globalThis.__sanguoPlay;const player=JSON.stringify(sample.model.state),cc=sample.cc;
  const m=new (require('./expedition').Expedition)(sample.config,sample.roster,{read:()=>null,write(){}});require('./classic-hooks').attach(m,sample.roster);Object.assign(m.state.meta,{chapter:41,cleared:40,signs:18});
  root=new cc.Node('solo-isolated-runtime-qa');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform).setContentSize(720,1280);sample.view.root.addChild(root);host=Object.create(Object.getPrototypeOf(sample.view));Object.assign(host,sample.view,{root,model:m,progress:m.progression,actors:new Map(),soloChallengeView:null});
  require('./solo-challenge-view').open(host,'arena');view=host.soloChallengeView;await capture('arena-lobby');
  tap('刘备');while(view.run.phase==='draft')tap('选择');if(view.run.phase!=='prepare')throw Error('未进入竞技准备');await capture('arena-prepare');
  tap('开始战斗');if(view.run.phase!=='result'||!view.replay?.initial.length)throw Error('未生成真实竞技战报');await capture('arena-battle');view.finish();await capture('arena-result');tap('领取并继续');report.arenaSettled=view.run.wins+view.run.losses===1;view.close();
  require('./solo-challenge-view').open(host,'dungeon');view=host.soloChallengeView;await capture('dungeon-list');tap('1. 怒炎峡谷');await capture('dungeon-detail');tap('选择并进入');if(view.run.section!==1||view.run.units.length!==3)throw Error('副本开局错误');await capture('dungeon-prepare');
  tap('开始战斗');if(view.run.phase!=='result'||!view.replay?.initial.length)throw Error('未生成真实副本战报');await capture('dungeon-battle');view.finish();tap('领取并继续');report.dungeonSettled=view.run.wins+view.run.losses===1;report.playerUnchanged=JSON.stringify(sample.model.state)===player;report.version=require('./app-version').version;report.phase=report.arenaSettled&&report.dungeonSettled&&report.playerUnchanged&&!report.captureError?'passed':'failed';
 }catch(error){report.phase='failed';report.error=String(error.stack||error);}finally{view?.close();if(root?.isValid)root.destroy();persist();}
}
module.exports={start};
