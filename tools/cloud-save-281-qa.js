/** 使用真实微信登录和线上接口验证逻辑双端；第二端只使用内存本地存储，不改玩家经济。 */
(function startCloudQA(){
 const g=GameGlobal[0],sample=g.__sanguoPlay,req=g.require;
 const platform=sample?.cloudSave?.api;
 if(!sample?.ready||!sample.cloudSave||req('play/app-version.js').version!=='1.0.281')throw Error('请先启动1.0.281并完成云存档初始化');
 if(g.__cloud281QA?.phase==='running')throw Error('验收已运行');
 const report=g.__cloud281QA={phase:'running',requests:[]};
 /** 包装真实平台请求，仅记录安全的路径、状态、业务码和请求号。 */
 function request(options){const success=options.success;return platform.request({...options,success(response){report.requests.push({path:options.url.replace(/^https?:\/\/[^/]+/,''),status:response.statusCode,code:response.data?.code,request_id:response.data?.request_id});success(response);}});}
 const tracking={request,login:options=>platform.login(options)};
 /** 串行执行后保留安全结果，禁止将令牌或完整玩家档返回控制台。 */
 async function verify(){
  const cloud=sample.cloudSave,policy=req('play/cloud-save-config.js'),{stable,CloudSave}=req('play/cloud-save.js');
  if(!await cloud.resume())throw Error('当前设备未就绪');await cloud.flush();
  const before=await cloud.session.request(policy.path+'/read',{},tracking);
  if(!before.exists)throw Error('没有已确认的云存档');
  const localBefore=platform.getStorageSync(sample.config.storageKey),modelBefore=JSON.stringify(sample.model.state);
  const normalized=req('play/challenge-storage.js').snapshot(sample.model.state);
  report.initialMatches=stable(before.snapshot.profile.campaign)===stable(normalized);if(!report.initialMatches)throw Error('当前模型与云端不一致');
  const entries=new Map();
  const isolated={...tracking,getStorageSync:key=>entries.get(key),setStorageSync:(key,value)=>entries.set(key,value)};
  const peerSession=req('play/backend-session.js').createSession();
  const peer=new CloudSave(isolated,sample.config,{session:peerSession,normalize:value=>req('play/cloud-save-bootstrap.js').candidate(value,sample.config,sample.roster),create:()=>{throw Error('验收不允许新建玩家档');},choose:async()=>{throw Error('内存新设备不应产生冲突');}});
  const previousObserver=cloud.onState;cloud.onState=()=>{};
  try{
   await peer.prepare();report.restoredMatches=stable(peer.local.read())===stable(normalized);
   await cloud.resume();report.oldPhase=cloud.phase;
   let operationRan=false,rejected=false;try{sample.model.transact(()=>{operationRan=true;});}catch{rejected=true;}
   report.oldTransactionRejected=rejected&&!operationRan;report.oldSessionLocked=!!cloud.session.locked();
   report.newSessionReady=await peer.resume();
   const after=await peerSession.request(policy.path+'/read',{},isolated);
   report.cloudUnchanged=after.revision===before.revision&&stable(after.snapshot)===stable(before.snapshot);
   report.localUnchanged=platform.getStorageSync(sample.config.storageKey)===localBefore&&JSON.stringify(sample.model.state)===modelBefore;
   report.revision=after.revision;report.version='1.0.281';
   if(!report.restoredMatches||report.oldPhase!=='replaced'||!report.oldTransactionRejected||!report.oldSessionLocked||!report.newSessionReady||!report.cloudUnchanged||!report.localUnchanged)throw Error('逻辑双端验收未满足全部断言');
   report.phase='passed';
  }finally{peer.dispose();cloud.onState=previousObserver;}
 }
 verify().catch(error=>{report.phase='failed';report.error={code:error.code||null,message:error.message};});
 return {phase:report.phase};
})()
