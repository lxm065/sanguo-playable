/** 在真实模拟器中仅注入临时网络故障；不修改玩家资源、关卡或存档。 */
(async function verifyQuietSync(){
 const g=GameGlobal[0],game=g.__sanguoPlay,cloud=game?.cloudSave,view=game?.view;
 if(!game?.ready||!cloud)throw Error('游戏尚未就绪');
 if(g.__quiet284Harness)throw Error('已有联调尚未恢复');
 const ui=g.__wxRequire('./cloud-save-ui'),report={version:g.__wxRequire('./app-version').version,phase:'starting',modalCalls:0};
 if(!await cloud.resume())throw Error('开始联调前须先同步成功');
 const before=JSON.stringify(cloud.local.read()),request=cloud.session.request,showModal=cloud.api.showModal;
 const profile=g.__wxRequire('./profile-settings-view').open(view);
 /** 只模拟存档路由失败，其他业务请求仍走原连接。 */
 function interrupted(path,...args){if(path.startsWith(cloud.policy.path+'/')){const error=Error('network');error.code='NETWORK';return Promise.reject(error);}return request(path,...args);}
 /** 记录原生提示次数，不隐藏本应出现的错误。 */
 function observedModal(options){report.modalCalls++;return showModal.call(cloud.api,options);}
 /** 恢复请求端口并核对同步成功与原档一致，异常或超时也必须恢复真实连接。 */
 async function finish(visualVerified=false){
  clearTimeout(watchdog);cloud.session.request=request;cloud.api.showModal=showModal;
  try{
   report.recovered=await cloud.resume();report.localUnchanged=JSON.stringify(cloud.local.read())===before;
   report.panelRetained=profile.isValid;report.visualVerified=visualVerified;
   report.phase=report.recovered&&report.localUnchanged&&report.panelRetained&&report.modalCalls===0&&report.shortSilent&&report.longPaused&&visualVerified?'passed':'needs-review';
  }finally{if(profile.isValid)profile.destroy();delete g.__quiet284Harness;g.__quiet284Result=report;console.log('QUIET284_RESULT '+JSON.stringify(report));}
  return report;
 }
 const watchdog=setTimeout(()=>finish(false).catch(console.error),60000);
 g.__quiet284Harness={finish,report};cloud.session.request=interrupted;cloud.api.showModal=observedModal;
 try{
  await cloud.resume();report.shortSilent=cloud.phase==='reconnecting'&&report.modalCalls===0&&!view.cloudIndicator;
  cloud.lastVerified=cloud.clock()-cloud.policy.leaseMs-1;let blocked=false;
  try{cloud.assertWritable();}catch(error){blocked=error.code==='CLOUD_SYNC_WAIT';ui.handleError(view,error);}
  report.longPaused=blocked&&cloud.phase==='offline'&&!!view.cloudIndicator?.isValid&&report.modalCalls===0&&profile.isValid;
  report.phase='awaiting-visual';console.log('QUIET284_STATE '+JSON.stringify(report));
 }catch(error){await finish(false);throw error;}
})();
