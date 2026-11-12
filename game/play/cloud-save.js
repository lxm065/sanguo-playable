'use strict';
const defaults=require('./cloud-save-config');

/** 递归规范化 JSON，仅用于准确比较进度，不依赖对象属性插入顺序或弱哈希。 */
function stable(value){return JSON.stringify(sort(value));}
/** 对象键排序，数组顺序与领域含义保持一致。 */
function sort(value){if(Array.isArray(value))return value.map(sort);if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(key=>[key,sort(value[key])]));return value;}
/** UTF-8 字节计数用于微信环境，避免依赖 Node Buffer。 */
function bytes(text){let total=0;for(const char of text){const code=char.codePointAt(0);total+=code<=127?1:code<=2047?2:code<=65535?3:4;}return total;}
/** 提交号仅用于幂等去重，不能作为鉴权凭据。 */
function commitID(now){return 'campaign-'+now.toString(36)+'-'+Math.random().toString(36).slice(2)+'-'+Math.random().toString(36).slice(2);}
/** 重试间隔按配置退避并封顶，恢复网络后无需等待下一轮退避。 */
function retryDelay(attempt,policy=defaults){return Math.min(policy.maxRetryMs,policy.retryMs*Math.pow(policy.retryFactor,attempt));}

/** 协调本机事务、持久提交日志与云端版本；网络层、时钟和交互均可注入。 */
class CloudSave{
 /** 构造端口不读取玩家档、不登录，启动流程负责先校验云端再创建可操作界面。 */
 constructor(api,rules,options={}){
  this.api=api;this.rules=rules;this.policy={...defaults,...options.policy};this.session=options.session||require('./backend-session');
  this.normalize=options.normalize;this.create=options.create;this.choose=options.choose;this.onState=options.onState||(()=>{});
  this.clock=options.clock||Date.now;this.schedule=options.schedule||setTimeout;this.cancel=options.cancel||clearTimeout;
  this.phase='starting';this.lastVerified=0;this.hidden=false;this.disposed=false;this.retryAttempt=0;this.foregroundGeneration=0;
  this.local=require('./storage').storage(api,{...rules,storageCorruptKey:this.policy.corruptKey,validateSnapshot:value=>this.normalize(value)},value=>this.saved(value),()=>this.assertWritable());
  this.unsubscribe=this.session.subscribe(code=>this.block(code==='SESSION_REPLACED'?'replaced':'expired',true));
 }
 /** 当前状态只返回进度说明，不暴露令牌或原始存档。 */
 status(){return this.policy.text[this.phase]||(!this.journal?this.policy.text.connecting:this.flight?this.policy.text.saving:this.journal.dirty?this.policy.text.pending:this.policy.text.synced);}
 /** 有效租约容忍短暂丢包；切回前台仍须重新验证，不能沿用后台之前的许可。 */
 hasLease(){return this.foregroundVerified===true&&this.clock()-this.lastVerified<=this.policy.leaseMs;}
 /** 变更前检查租约；临时等待交给轻量状态提示，事务与奖励副作用仍在操作前拦截。 */
 assertWritable(){
  if(!['ready','reconnecting'].includes(this.phase)||this.hidden||this.session.locked()||!this.hasLease()){
   if(!this.terminal&&!this.hidden)this.reconnect();
   const error=Error(this.status());error.code=this.terminal?'CLOUD_SAVE_BLOCKED':'CLOUD_SYNC_WAIT';throw error;
  }
 }
 /** 账号独立的同步日志；损坏日志不能被当作已同步进度。 */
 loadJournal(){
  this.journalKey=this.policy.metadataKey+'.'+this.playerID;
  this.rawJournal=this.api.getStorageSync(this.journalKey);
  let value;
  try{value=this.rawJournal&&JSON.parse(this.rawJournal);}catch{}
  this.invalidJournal=!!this.rawJournal&&(!value||value.playerID!==this.playerID||!Number.isSafeInteger(value.revision)||value.revision<0||typeof value.ack!=='string'||(value.pending&&(!value.pending.snapshot?.profile?.campaign||value.pending.base_revision!==value.revision||typeof value.pending.commit_id!=='string')));
  if(!value||this.invalidJournal)value={playerID:this.playerID,revision:0,ack:'',pending:null,dirty:false};
  this.journal=value;
 }
 /** 写请求前先持久化完整幂等载荷，响应丢失后仍使用同一提交号。 */
 persist(){try{this.api.setStorageSync(this.journalKey,JSON.stringify(this.journal));}catch(error){this.block('localError',true);throw error;}}
 /** 覆盖前保存有界恢复包，恢复包写入失败时停止替换。 */
 archive(remote,reason){this.api.setStorageSync(this.policy.archiveKey+'.'+this.playerID,JSON.stringify({reason,at:this.clock(),owner:this.api.getStorageSync(this.policy.ownerKey)||null,primary:this.api.getStorageSync(this.rules.storageKey)||null,backup:this.api.getStorageSync(this.rules.storageBackupKey)||null,journal:this.api.getStorageSync(this.journalKey)||null,remote:remote||null}));}
 /** 安装已校验快照，旧主档作为备份；损坏主档另存，避免污染有效备份。 */
 install(value,validLocal){
  const text=this.api.getStorageSync(this.rules.storageKey);
  if(text)this.api.setStorageSync(validLocal?this.rules.storageBackupKey:this.policy.corruptKey,text);
  this.api.setStorageSync(this.rules.storageKey,JSON.stringify(value));
  this.api.setStorageSync(this.policy.ownerKey,this.playerID);
  this.latest=value;
 }
 /** 启动先读取真实云端；失败不会创建空档或覆盖已有进度。 */
 async prepare(){
  await this.session.login(this.api);this.playerID=this.session.identity();if(!this.playerID)throw Error(this.policy.text.invalid);
  this.loadJournal();let local=null,localError=null;
  try{const value=this.local.read();if(value)local=this.normalize(value);}catch(error){localError=error;}
  const remote=await this.session.request(this.policy.path+'/read',{},this.api);
  if(typeof remote?.exists!=='boolean'||!Number.isSafeInteger(remote.revision)||remote.revision<0)throw Error(this.policy.text.invalid);
  this.lastVerified=this.clock();
  const owner=this.api.getStorageSync(this.policy.ownerKey);
  if(this.invalidJournal)this.archive(remote,'damaged-sync-journal');
  if(owner&&owner!==this.playerID){this.archive(remote,'account-changed');local=null;localError=null;}
  const rawRemote=remote.exists?remote.snapshot?.profile?.campaign:null;
  let cloud=null;
  if(remote.exists){if(!rawRemote||remote.schema_version!==this.policy.schemaVersion||remote.revision<1)throw Error(this.policy.text.invalid);cloud=this.normalize(rawRemote);}
  const remoteText=cloud?stable(rawRemote):'',localText=local?stable(local):'';
  const knownBase=this.journal.revision===remote.revision&&this.journal.ack===remoteText;
  const pending=this.journal.pending;
  const acknowledged=pending&&remote.exists&&pending.commit_id===remote.commit_id&&remote.revision===pending.base_revision+1&&stable(pending.snapshot.profile.campaign)===remoteText;
  let chosen;
  if(!cloud){if(localError)throw Error(this.policy.text.missing);chosen=local||this.create();}
  else if(!local){if(localError)this.archive(remote,'damaged-local');chosen=cloud;}
  else if(stable(cloud)===localText){chosen=cloud;}
  else if(knownBase||acknowledged){chosen=local;}
  else{
   this.archive(remote,'different-progress');
   const choice=await this.choose({local,cloud,remote});
   if(!['cloud','local'].includes(choice))throw Error(this.policy.text.conflict);
   chosen=choice==='local'?local:cloud;
  }
  await this.session.request(this.policy.path+'/heartbeat',{},this.api);this.lastVerified=this.clock();
  if(this.terminal)throw Error(this.status());
  this.install(chosen,!!local);
  // 未确认的原请求仍留在日志中；确定服务器版本后才清除或重放。
  const retryPending=pending&&knownBase&&pending.base_revision===remote.revision;
  this.journal={playerID:this.playerID,revision:remote.revision,ack:remoteText,pending:retryPending?pending:null,dirty:stable(chosen)!==remoteText};
  this.persist();this.foregroundVerified=true;this.phase='ready';this.onState(this);
  return chosen;
 }
 /** 本机写入成功后记录最新进度；日志故障锁定后续操作，但不撤销已成功落盘的数据。 */
 saved(value){
  this.latest=value;this.journal.dirty=stable(value)!==this.journal.ack;
  try{this.persist();this.scheduleFlush(this.policy.debounceMs);}catch{this.block('localError',true);}
 }
 /** 合并短时多次修改；后台定时任务不产生未处理的 Promise 拒绝。 */
 scheduleFlush(delay){if(this.disposed||this.terminal||this.phase!=='ready'||this.flushTimer)return;this.flushTimer=this.schedule(()=>{this.flushTimer=null;this.flush().catch(()=>{});},delay);}
 /** 串行复用同一飞行请求，防止多入口上传时重复推进修订号。 */
 flush(){if(this.flight)return this.flight;this.flight=this.commit().finally(()=>{this.flight=null;this.onState(this);});return this.flight;}
 /** 一个请求只提交一个持久载荷；后续修改等待下一批次，不改写在途内容。 */
 async commit(){
  if(this.terminal||this.disposed||!this.journal)return;
  if(!this.journal.pending&&!this.journal.dirty)return;
  try{
   this.assertWritable();
   if(!this.journal.pending){
    const snapshot={profile:{campaign:this.latest}};
    if(bytes(JSON.stringify(snapshot))>this.policy.maxSnapshotBytes){this.block('invalid',true);throw Error(this.policy.text.invalid);}
    this.journal.pending={commit_id:commitID(this.clock()),base_revision:this.journal.revision,schema_version:this.policy.schemaVersion,client_version:require('./app-version').version,snapshot:JSON.parse(JSON.stringify(snapshot)),runs:[]};
    this.persist();
   }
   const pending=this.journal.pending;
   const result=await this.session.request(this.policy.path+'/commit',pending,this.api);
   if(this.terminal||this.disposed)return;
   if(result?.revision!==pending.base_revision+1||result.commit_id!==pending.commit_id){this.block('invalid',true);throw Error(this.policy.text.invalid);}
   this.lastVerified=this.clock();this.journal.revision=result.revision;this.journal.ack=stable(pending.snapshot.profile.campaign);this.journal.pending=null;
   this.journal.dirty=stable(this.latest)!==this.journal.ack;this.persist();
   if(this.journal.dirty)this.scheduleFlush(this.policy.debounceMs);
  }catch(error){
   if(!this.terminal){if(error.code==='CONFLICT'){try{this.archive(null,'commit-conflict');}catch{}this.block('conflict',true);}else this.reconnect();}
   throw error;
  }
 }
 /** 合并网络恢复、心跳和手动同步的并发请求，防止瞬时重连风暴。 */
 resume(){
  if(this.terminal||this.disposed||this.hidden)return Promise.resolve(false);
  if(this.resuming)return this.resuming;
  this.resuming=this.verify().finally(()=>{this.resuming=null;if(this.phase==='checking')this.queueRetry();});return this.resuming;
 }
 /** 心跳确认后重放原幂等载荷；只有完整同步成功才重置退避。 */
 async verify(){
  const generation=this.foregroundGeneration;
  try{
   await this.session.request(this.policy.path+'/heartbeat',{},this.api);
   if(this.terminal||this.disposed||this.hidden||generation!==this.foregroundGeneration)return false;
   this.lastVerified=this.clock();this.foregroundVerified=true;this.phase='ready';
   await this.flush();if(this.terminal||this.disposed||this.hidden||generation!==this.foregroundGeneration)return false;
   if(this.phase==='ready'){this.cancel(this.retryTimer);this.retryTimer=null;this.retryAttempt=0;}
   this.onState(this);return this.phase==='ready';
  }catch(error){if(!this.terminal&&!this.disposed)this.reconnect();return false;}
 }
 /** 临时故障仅更新状态；租约内继续本机事务，超时后静默等待重新验证。 */
 reconnect(){
  if(this.terminal||this.disposed)return;
  this.phase=this.hasLease()?'reconnecting':'offline';this.onState(this);this.queueRetry();
 }
 /** 单个恢复定时器使用有界退避，暂停到后台时不持续发请求。 */
 queueRetry(){
  if(!this.started||this.hidden||this.terminal||this.disposed||this.retryTimer)return;
  this.retryTimer=this.schedule(()=>{this.retryTimer=null;return this.resume();},retryDelay(this.retryAttempt++,this.policy));
 }
 /** 统一锁定入口；永久冲突和顶号不被重试或心跳重新解锁。 */
 block(phase,terminal=false){if(this.terminal)return;this.phase=phase;this.terminal=terminal;if(terminal){this.cancel(this.retryTimer);this.cancel(this.flushTimer);this.cancel(this.heartbeatTimer);this.retryTimer=null;this.flushTimer=null;}this.onState(this);}
 /** 装配前后台与心跳，离开前尽力提交；后台完成情况以服务端回执为准。 */
 start(){
  if(this.started||this.disposed||this.terminal)return;this.started=true;
  this.onHide=()=>{this.flush().catch(()=>{});this.hidden=true;this.foregroundVerified=false;this.foregroundGeneration++;this.cancel(this.retryTimer);this.retryTimer=null;};
  this.onShow=()=>{if(this.disposed||this.terminal)return;this.hidden=false;this.phase='checking';this.onState(this);this.resume();};
  this.onNetwork=event=>{if(this.disposed||this.terminal||this.hidden)return;if(event.isConnected)this.resume();else this.reconnect();};
  this.api.onHide?.(this.onHide);this.api.onShow?.(this.onShow);this.api.onNetworkStatusChange?.(this.onNetwork);
  if(['offline','reconnecting'].includes(this.phase))this.queueRetry();
  this.tick();
 }
 /** 单个定时器控制检测频率，网络恢复后重试持久提交。 */
 tick(){if(this.disposed||this.terminal)return;this.heartbeatTimer=this.schedule(async()=>{if(!this.hidden&&!this.retryTimer)await this.resume();this.tick();},this.policy.heartbeatMs);}
 /** 释放定时器和会话监听，避免测试或重启残留任务。 */
 dispose(){this.disposed=true;this.cancel(this.flushTimer);this.cancel(this.retryTimer);this.cancel(this.heartbeatTimer);this.unsubscribe?.();if(this.started){this.api.offHide?.(this.onHide);this.api.offShow?.(this.onShow);this.api.offNetworkStatusChange?.(this.onNetwork);}}
}
module.exports={CloudSave,stable,bytes,retryDelay};
