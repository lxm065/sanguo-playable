'use strict';
const config=require('./fortress-backend-config');
let token=null,loggingIn=null;
/** 统一平台请求；错误只返回状态，不包含令牌、登录code或响应正文。 */
function http(api,path,data,auth){return new Promise((resolve,reject)=>api.request({url:config.baseUrl+path,method:'POST',data,timeout:config.timeoutMs,header:{'content-type':'application/json',...(auth?{Authorization:'Bearer '+auth}:{})},success:r=>{if(r.statusCode>=200&&r.statusCode<300&&r.data?.code==='OK')resolve(r.data.data);else {const e=Error(String(r.statusCode));e.code=r.data?.code;reject(e);}},fail:()=>reject(Error('network'))}));}
/** 使用微信临时凭证登录现有后端，只在内存保留玩家令牌。 */
function login(api){if(token&&token.until>Date.now()+60000)return Promise.resolve(token.value);if(loggingIn)return loggingIn;loggingIn=new Promise((resolve,reject)=>api.login({success:r=>r.code?resolve(r.code):reject(Error('login')),fail:()=>reject(Error('login'))})).then(code=>http(api,config.loginPath,{game_identifier:config.gameIdentifier,code,game_version:require('./app-version').version,channel:'wechat',locale:'zh-CN'})).then(r=>{token={value:r.access_token,until:Date.parse(r.expires_at)};return token.value;}).finally(()=>{loggingIn=null;});return loggingIn;}

/** 统一玩家鉴权，401 清空失效令牌；不得输出登录凭据。 */
async function request(path,data={},api=typeof wx==='undefined'?null:wx){if(!api?.request||!api?.login)throw Error('platform');try{return await http(api,path,data,await login(api));}catch(e){if(e.message==='401')reset();throw e;}}
/** 令牌失效后仅在下一次请求重新登录。 */
function reset(){token=null;}
module.exports={request,login,http,reset};
