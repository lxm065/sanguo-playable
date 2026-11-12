'use strict';
const config=require('./fortress-backend-config'),policy=require('./cloud-save-config');
/** 每个运行实例拥有独立令牌；被顶号后锁定，后台重试不得自动抢回会话。 */
function createSession(connection=config,options={}){
 const clock=options.clock||Date.now,listeners=new Set();
 let token=null,loggingIn=null,terminal=null,authenticated=false;
 /** 广播不可恢复的会话错误，不输出凭据或服务端响应正文。 */
 function lock(code){if(terminal)return;terminal=code;for(const listener of listeners)listener(code);}
 /** 创建安全的协议错误，仅保留业务码和状态码。 */
 function failure(status,code){const error=Error(String(status));error.code=code;if(code==='SESSION_REPLACED')lock(code);return error;}
 /** 统一受限 POST 请求，过期或撤销不通过重新登录隐藏。 */
 function http(api,path,data,auth){return new Promise((resolve,reject)=>api.request({url:connection.baseUrl+path,method:'POST',data,timeout:connection.timeoutMs,header:{'content-type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},success:r=>{if(r.statusCode>=200&&r.statusCode<300&&r.data?.code==='OK')resolve(r.data.data);else reject(failure(r.statusCode,r.data?.code));},fail:()=>reject(failure('network','NETWORK'))}));}
 /** 同机续期携带旧令牌证明；初次启动才创建新会话，过期实例必须明确重新进入。 */
 function login(api){
  if(terminal)return Promise.reject(failure('401',terminal));
  if(token&&token.until>clock()+policy.refreshAheadMs)return Promise.resolve(token.value);
  if(loggingIn)return loggingIn;
  if(authenticated&&(!token||token.until<=clock())){lock('SESSION_EXPIRED');return Promise.reject(failure('401','SESSION_EXPIRED'));}
  const previous=token?.value;
  loggingIn=new Promise((resolve,reject)=>api.login({success:r=>r.code?resolve(r.code):reject(failure('login','LOGIN')),fail:()=>reject(failure('login','LOGIN'))}))
   .then(code=>http(api,connection.loginPath,{game_identifier:connection.gameIdentifier,code,game_version:require('./app-version').version,channel:'wechat',locale:'zh-CN',...(previous?{previous_access_token:previous}:{})}))
   .then(result=>{const until=Date.parse(result.expires_at);if(!result.access_token||!result.player?.player_id||!Number.isFinite(until)||until<=clock())throw failure('login','INVALID_SESSION');token={value:result.access_token,until,playerID:String(result.player.player_id)};authenticated=true;return token.value;})
   .finally(()=>{loggingIn=null;});
  return loggingIn;
 }
 /** 业务调用共享当前会话，401 明确锁定并等待用户重新进入。 */
 async function request(path,data={},api=typeof wx==='undefined'?null:wx){
  if(!api?.request||!api?.login)throw failure('platform','PLATFORM');
  try{return await http(api,path,data,await login(api));}catch(error){if(error.message==='401'&&!terminal)lock(error.code==='SESSION_REPLACED'?'SESSION_REPLACED':'SESSION_EXPIRED');throw error;}
 }
 /** 历史调用方收到 401 后只能锁定当前实例，禁止自动发起新设备登录。 */
 function reset(){if(authenticated)lock('SESSION_EXPIRED');else token=null;}
 /** 返回非敏感玩家编号供存档隔离，令牌始终只在内存中。 */
 function identity(){return token?.playerID||null;}
 /** 订阅会话撤销；返回取消函数供测试及生命周期释放。 */
 function subscribe(listener){listeners.add(listener);return ()=>listeners.delete(listener);}
 return {request,login,http,reset,identity,subscribe,locked:()=>terminal};
}
module.exports={...createSession(),createSession};
