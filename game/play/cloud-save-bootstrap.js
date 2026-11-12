'use strict';
const policy=require('./cloud-save-config'),ui=require('./cloud-save-ui');
/** 在隔离存储中执行现行领域迁移和校验，不读写真实玩家档或触发联网。 */
function candidate(value,rules,roster){
 const {Expedition}=require('./expedition');
 const model=new Expedition(rules,roster,{read:()=>value?JSON.parse(JSON.stringify(value)):null,write(){}});
 require('./classic-hooks').attach(model,roster);
 if(!model.valid(model.state))throw Error(policy.text.invalid);
 return require('./challenge-storage').snapshot(model.state);
}
/** 临时连接错误在开场静默退避，禁止错误降级成新建空档；坏档仍需明确处理。 */
async function retry(api,error,options,attempt){
 const transient=['NETWORK','LOGIN','RATE_LIMITED','CLOUD_SYNC_WAIT'].includes(error.code)||Number(error.message)>=500;
 if(!transient)return ui.retry(api,error);
 options.onStatus?.(policy.text.startupRetry);
 await new Promise(resolve=>(options.schedule||setTimeout)(resolve,require('./cloud-save').retryDelay(attempt)));
 return true;
}
/** 启动先验证账号和云档，短时断网无需玩家反复点重试。 */
async function initialize(api,rules,roster,options={}){
 if(!policy.enabled)return null;
 const {CloudSave}=require('./cloud-save');
 const cloud=new CloudSave(api,rules,{session:options.session,normalize:value=>candidate(value,rules,roster),create:()=>candidate(null,rules,roster),choose:value=>ui.choose(api,value)});
 for(let attempt=0;;attempt++){
  try{await cloud.prepare();return cloud;}
  catch(error){if(cloud.terminal){ui.notify(api,cloud);cloud.dispose();return false;}if(!await retry(api,error,options,attempt)){cloud.dispose();return false;}}
 }
}
/** 真实模型初始化产生的迁移也先取得云端回执，再开放可操作界面。 */
async function ready(api,cloud,options={}){
 if(!cloud)return true;
 for(let attempt=0;;attempt++){
  try{if(cloud.phase!=='ready'){if(!await cloud.resume()){const error=Error(cloud.status());error.code='CLOUD_SYNC_WAIT';throw error;}}await cloud.flush();if(cloud.terminal)throw Error(cloud.status());return true;}
  catch(error){if(cloud.terminal){ui.notify(api,cloud);cloud.dispose();return false;}if(!await retry(api,error,options,attempt)){cloud.dispose();return false;}}
 }
}
module.exports={candidate,initialize,ready,retry};
