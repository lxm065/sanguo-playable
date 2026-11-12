'use strict';
const defaults=require('./play-benefits-config'),instances=new WeakMap();

/** 按数字段比较基础库和微信版本，避免 3.9 被字符串比较误判为高于 3.17。 */
function atLeast(actual,minimum){const a=String(actual||'').split('.'),b=minimum.split('.');return b.every((_,i)=>Number.isFinite(Number(a[i])))&&compare(a,b)>=0;}
/** 数字段按高位优先比较，缺省尾段视为零。 */
function compare(a,b){for(let i=0;i<Math.max(a.length,b.length);i++){const n=Number(a[i]||0)-Number(b[i]||0);if(n)return n;}return 0;}
/** 信息接口异常只影响可选权益入口，不能中断游戏启动。 */
function info(platform,method){try{return platform?.[method]?.()||{};}catch{return {};}}

/** 封装微信全局权益组件；购买和使用事件仅保存在内存，绝不生成游戏奖励凭据。 */
class PlayBenefits{
 /** 注入平台与配置，保持平台商品、游戏经济和界面布局各自独立。 */
 constructor(platform,config=defaults){this.platform=platform;this.config=config;this.card=null;this.handlers=null;this.loading=null;this.showing=null;this.disposed=false;this.state={ready:false,presenting:false,lastCloseResult:null,lastUsedCount:null,lastError:null};}
 /** 使用实际平台、微信版本、基础库及 API 探测共同决定入口是否可见。 */
 availability(){
  const c=this.config,p=this.platform;
  if(this.disposed)return {supported:false,reason:'disposed'};
  if(!c.enabled)return {supported:false,reason:'disabled'};
  const device=info(p,'getDeviceInfo'),app=info(p,'getAppBaseInfo');
  const legacy=device.platform&&app.SDKVersion&&app.version?{}:info(p,'getSystemInfoSync');
  const kind=String(device.platform||legacy.platform||'').toLowerCase(),simulator=kind==='devtools'&&c.allowSimulator;
  if(!simulator&&!c.supportedPlatforms.includes(kind))return {supported:false,reason:'unsupported'};
  if(!atLeast(app.SDKVersion||legacy.SDKVersion,c.minimumBaseLibrary)||(!simulator&&!atLeast(app.version||legacy.version,c.minimumWechatVersion)))return {supported:false,reason:'outdated'};
  try{if(typeof p?.createAdSkipCard!=='function'||(typeof p.canIUse==='function'&&!p.canIUse('createAdSkipCard')))return {supported:false,reason:'unavailable'};}catch{return {supported:false,reason:'unavailable'};}
  return {supported:true,reason:null};
 }
 /** 只返回平台回调的观察状态，不推断购买资格、剩余额度或有效期。 */
 status(){return {...this.availability(),...this.state,loading:!!this.loading,busy:!!this.showing};}
 /** 将平台异常转换为可配置的用户提示，并保留错误码用于诊断。 */
 error(reason,native){const error=Error(this.config.text[reason].replace('{wechat}',this.config.minimumWechatVersion));error.code=reason;if(native?.errCode!==undefined)error.platformCode=native.errCode;return error;}
 /** 只创建一次全局组件，并用固定函数引用注册和注销事件。 */
 ensure(){
  const support=this.availability();if(!support.supported)throw this.error(support.reason);
  if(this.card)return this.card;
  let card;
  try{
   card=this.platform.createAdSkipCard();
   for(const name of ['load','show','onLoad','offLoad','onShow','offShow','onClose','offClose','onError','offError','onUse','offUse'])if(typeof card?.[name]!=='function')throw this.error('unavailable');
   this.handlers={
    Load:()=>{this.state.ready=true;this.state.lastError=null;this.settle('loading');},
    Show:()=>this.opened(),
    Close:res=>{this.state.presenting=false;this.state.lastCloseResult=res?.result||null;this.settle('showing',null,this.state.lastCloseResult);},
    Error:err=>{const error=this.error(err?.errCode===-1001?'loadFailed':'showFailed',err);this.state.lastError=error.message;if(err?.errCode!==-1002)this.settle('loading',error);if(err?.errCode!==-1001){this.state.presenting=false;this.settle('showing',error);}},
    Use:res=>{if(Number.isInteger(res?.usedCount)&&res.usedCount>=0)this.state.lastUsedCount=res.usedCount;}
   };
   for(const [name,handler]of Object.entries(this.handlers))card['on'+name](handler);
   this.card=card;return card;
  }catch(error){if(card&&this.handlers)for(const [name,handler]of Object.entries(this.handlers)){try{card['off'+name]?.(handler);}catch{}}this.handlers=null;throw this.error('unavailable');}
 }
 /** 合并重复请求；超时仅覆盖平台响应阶段，不限制用户停留购买页的时间。 */
 pending(kind){
  let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const pending={promise,resolve,reject,timer:null};this[kind]=pending;
  pending.timer=setTimeout(()=>{if(this[kind]!==pending)return;const error=this.error('timeout');this.state.lastError=error.message;this.settle(kind,error);},this.config.requestTimeoutMs);
  return pending;
 }
 /** 结算指定请求且清除计时器，重复回调与晚到的 Promise 不会重复完成。 */
 settle(kind,error,value){const pending=this[kind];if(!pending)return;this[kind]=null;clearTimeout(pending.timer);if(error)pending.reject(error);else pending.resolve(value);}
 /** show.success 只表示购买页打开，购买结果必须等待 onClose。 */
 opened(){this.state.presenting=true;if(this.showing)clearTimeout(this.showing.timer);}
 /** 启动时后台预加载；失败可重试，调用者负责隔离可选功能错误。 */
 preload(){
  if(this.loading)return this.loading.promise;
  let card;try{card=this.ensure();}catch(error){return Promise.reject(error);}
  if(this.state.ready)return Promise.resolve();
  const pending=this.pending('loading');
  const success=()=>{if(this.loading!==pending)return;this.state.ready=true;this.state.lastError=null;this.settle('loading');};
  const fail=err=>{if(this.loading!==pending)return;const error=this.error('loadFailed',err);this.state.lastError=error.message;this.settle('loading',error);};
  try{const result=card.load({success,fail});if(result?.then)result.then(success,fail);}catch(error){fail(error);}
  return pending.promise;
 }
 /** 用户点击时直接调用原生 show，避免 await 预加载丢失用户手势。 */
 show(){
  if(this.showing)return this.showing.promise;
  let card;try{card=this.ensure();}catch(error){return Promise.reject(error);}
  const pending=this.pending('showing');this.state.lastError=null;
  const success=()=>{if(this.showing===pending)this.opened();};
  const fail=err=>{if(this.showing!==pending)return;const error=this.error('showFailed',err);this.state.presenting=false;this.state.lastError=error.message;this.settle('showing',error);};
  try{const result=card.show({success,fail});if(result?.then)result.then(success,fail);}catch(error){fail(error);}
  return pending.promise;
 }
 /** 释放自己注册的监听；不销毁或主动关闭微信托管的全局组件。 */
 dispose(){if(this.disposed)return;this.disposed=true;const error=this.error('disposed');this.settle('loading',error);this.settle('showing',error);if(this.card&&this.handlers)for(const [name,handler]of Object.entries(this.handlers))this.card['off'+name](handler);this.card=null;this.handlers=null;this.state.presenting=false;}
}

/** 同一平台共享一个适配器，避免重复监听微信全局单例。 */
function get(platform){if(!platform||!['object','function'].includes(typeof platform))return new PlayBenefits(platform);let service=instances.get(platform);if(!service||service.disposed){service=new PlayBenefits(platform);instances.set(platform,service);}return service;}
module.exports={PlayBenefits,get,atLeast};
