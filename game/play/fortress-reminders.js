'use strict';
const config=require('./fortress-backend-config');
const {login,http,reset}=require('./backend-session');
let running=false,retry=null,current=null,watching=false;
/** 生成两类提醒的绝对时间；已可领取的宝箱不再发送到期提醒。 */
function snapshot(state,policy){return {build_at:state?.build?.end||0,chest_at:state?.ready?0:state?.level?state.nextAt||0:state?.build?.end||0};}
/** 写入最新持久化快照，保留尚未上传的授权结果，重复重试使用同一编号。 */
function enqueue(progress,policy,grant=null){if(!config.enabled||!config.gameIdentifier)return;current=progress;progress.model.transact(()=>{const all=progress.state.fortressReminders||(progress.state.fortressReminders={}),old=all[policy.stateKey],seq=progress.state.fortressReminderRevision||0,revision=Math.max(Date.now(),seq+1);progress.state.fortressReminderRevision=revision;all[policy.stateKey]={building:policy.stateKey,revision,...snapshot(progress.state[policy.stateKey],policy),grant_id:grant?.id||old?.grant_id||'',accepted:grant?.accepted||old?.accepted||[]};});flush(progress);}
/** 串行上传，失败保留 outbox；再次登录或回到前台继续，不回滚本地游戏奖励。 */
async function flush(progress,api=typeof wx==='undefined'?null:wx){if(!config.enabled||!config.gameIdentifier||!api?.request||!api?.login)return;current=progress;if(!watching&&api.onShow){watching=true;api.onShow(()=>{if(current)flush(current,api);});}if(running||!Object.keys(progress.state.fortressReminders||{}).length)return;running=true;try{const auth=await login(api);for(const item of Object.values(progress.state.fortressReminders||{})){await http(api,config.syncPath,item,auth);progress.model.transact(()=>{if(progress.state.fortressReminders?.[item.building]?.revision===item.revision)delete progress.state.fortressReminders[item.building];});}}catch(e){if(e.message==='401')reset();}finally{running=false;if(Object.keys(current?.state.fortressReminders||{}).length&&!retry)retry=setTimeout(()=>{retry=null;flush(current,api);},config.retryMs);}}
/** 授权结果只登记 accept 项，不把取消、拒绝或失败当成授权。 */
function accepted(result,templates){return Object.keys(templates).filter(k=>result[templates[k]]==='accept');}
module.exports={enqueue,flush,snapshot,accepted};
