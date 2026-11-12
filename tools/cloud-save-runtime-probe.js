'use strict';
/** 在真实小游戏引擎内自动验收，不修改玩家经济或清空本机存档。 */
async function start(api,runID){
 const fs=api.getFileSystemManager(),base=api.env.USER_DATA_PATH+'/quiet-'+runID;
 const report={runID,phase:'entry-loaded',screens:[],modalCalls:0,recoveryRequests:0};
 let restore=()=>{},panel=null,sample=null,watchdog=null;
 /** 仅输出布尔验收结果与截图，不输出玩家存档或令牌。 */
 function persist(){fs.writeFileSync(base+'.json',JSON.stringify(report,null,2),'utf8');}
 /** 等待真实状态，不通过手动调用恢复方法伪造自动恢复。 */
 async function until(check,timeout){const end=Date.now()+timeout;while(!check()){if(Date.now()>end)throw Error('等待状态超时: '+report.phase);await new Promise(resolve=>setTimeout(resolve,100));}}
 /** 等待真实画帧后从游戏主画布截图，失败时保留原因而不冒充视觉通过。 */
 async function capture(name){
  const canvas=sample.cc.game.canvas||(typeof GameGlobal!=='undefined'?GameGlobal.screencanvas:null);
  report.canvas={width:canvas?.width,height:canvas?.height,toTempFilePathSync:typeof canvas?.toTempFilePathSync,toDataURL:typeof canvas?.toDataURL};
  await new Promise(resolve=>{
   let finished=false;
   /** 在游戏真正绘制完成时导出，避免读到呈现后已清空的 WebGL 缓冲。 */
   function save(){if(finished)return;finished=true;clearTimeout(timer);try{
    const file=base+'-'+name+'.png';
    if(typeof canvas?.toTempFilePathSync==='function')fs.copyFileSync(canvas.toTempFilePathSync({fileType:'png'}),file);
    else{const data=canvas?.toDataURL?.('image/png');report.canvas.dataPrefix=String(data).slice(0,40);if(!data?.startsWith('data:image/png;base64,'))throw Error('画布没有返回PNG');fs.writeFileSync(file,data.split(',')[1],'base64');}
    report.screens.push({name,file:file.split('/').pop()});
   }catch(error){report.captureError=String(error.message||error);}resolve();}
   const timer=setTimeout(save,2000);sample.cc.director.once(sample.cc.Director.EVENT_AFTER_DRAW,save);
  });
 }
 /** 无论失败或超时都解除故障注入，保留必要错误提示。 */
 function cleanup(){restore();if(panel?.isValid)panel.destroy();clearTimeout(watchdog);}
 persist();
 try{
  report.phase='waiting-ready';persist();
  await until(()=>!!globalThis.__sanguoPlay?.ready,120000);sample=globalThis.__sanguoPlay;
  const cloud=sample.cloudSave,v=sample.view,ui=require('./cloud-save-ui');
  report.version=require('./app-version').version;
  if(!await cloud.resume())throw Error('初始会话未就绪: '+cloud.phase);
  await cloud.flush();
  const before=JSON.stringify(cloud.local.read()),playerBefore=JSON.stringify(sample.model.state),revision=cloud.journal.revision;
  const request=cloud.session.request,showModal=api.showModal,render=v.render;
  let interrupted=true,renders=0,effects=0,failures=0;report.renderCalls=[];
  panel=require('./profile-settings-view').open(v);
  /** 仅存档路由故障，其他业务连接继续使用原端口。 */
  cloud.session.request=function(path,...args){
   if(path.startsWith(cloud.policy.path+'/')){
    if(interrupted){failures++;const error=Error('network');error.code='NETWORK';return Promise.reject(error);}
    report.recoveryRequests++;
   }
   return request(path,...args);
  };
  /** 记录原生模态调用，绝不隐藏真实顶号或存档冲突。 */
  api.showModal=function(options){report.modalCalls++;return showModal.call(api,options);};
  /** 记录是否重建了玩家当前页面。 */
  v.render=function(...args){renders++;report.renderCalls.push({phase:report.phase,panelValid:panel.isValid,stack:String(new Error().stack).split('\n').slice(1,7).join('\n')});return render.apply(this,args);};
  restore=()=>{interrupted=false;cloud.session.request=request;api.showModal=showModal;v.render=render;};
  watchdog=setTimeout(()=>{cleanup();report.phase='watchdog-restored';persist();},60000);
  report.phase='short-outage';
  await cloud.resume();report.shortSilent=cloud.phase==='reconnecting'&&report.modalCalls===0&&!v.cloudIndicator;
  cloud.assertWritable();report.shortWritable=true;
  await capture('short');persist();
  cloud.lastVerified=cloud.clock()-cloud.policy.leaseMs-1;
  report.phase='long-outage';
  v.act(()=>sample.model.transact(()=>{effects++;}));
  report.longPaused=cloud.phase==='offline'&&effects===0;
  report.panelRetainedDuringOutage=panel.isValid&&renders===0;
  report.panelValidDuringOutage=panel.isValid;
  const labels=[];
  /** 检查轻量提示节点的实际 Label 内容。 */
  function labelsIn(node){if(!node)return;const label=node.getComponent(sample.cc.Label);if(label)labels.push(label.string);for(const child of node.children)labelsIn(child);}
  labelsIn(v.cloudIndicator);report.indicatorText=labels.join(' ');
  report.indicatorVisible=!!v.cloudIndicator?.isValid;
  await capture('long');persist();
  report.phase='waiting-automatic-recovery';interrupted=false;const recoveredAt=Date.now();
  await until(()=>cloud.phase==='ready'&&!cloud.retryTimer&&!cloud.resuming,cloud.policy.maxRetryMs+15000);
  report.autoRecoveryMs=Date.now()-recoveredAt;report.recovered=true;
  cloud.assertWritable();report.writableAfterRecovery=true;
  report.localUnchanged=JSON.stringify(cloud.local.read())===before;
  report.playerUnchanged=JSON.stringify(sample.model.state)===playerBefore;
  report.revisionUnchanged=cloud.journal.revision===revision;
  report.indicatorRemoved=!v.cloudIndicator;
  report.panelRetained=panel.isValid&&renders===0;report.panelValidAfterRecovery=panel.isValid;report.renders=renders;
  report.injectedFailures=failures;
  await capture('recovered');
  report.phase=report.shortSilent&&report.shortWritable&&report.longPaused&&report.panelRetained&&report.recovered&&report.writableAfterRecovery&&report.localUnchanged&&report.playerUnchanged&&report.revisionUnchanged&&report.indicatorVisible&&report.indicatorRemoved&&report.modalCalls===0&&report.recoveryRequests>0?'passed':'failed';
 }catch(error){report.phase='failed';report.error=String(error.stack||error).slice(0,1800);}
 finally{cleanup();persist();console.log('QUIET_RUNTIME_RESULT '+JSON.stringify(report));}
}
module.exports={start};
