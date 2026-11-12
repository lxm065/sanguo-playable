'use strict';
/** 隔离真实激励广告与开发验收，失败和取消均不产生奖励凭据。 */
class RewardedAds{
 /** 注入平台与广告位配置，不硬编码真实广告位。 */
 constructor(platform,config){this.platform=platform;this.config=config;this.text=require('./rewarded-ad-config').text;this.busy=false;}
 /** 观看或平台权益跳过均等待标准完成回调；购买事件不参与奖励判定。 */
 async show(){
  if(this.busy)throw Error(this.text.busy);
  if(this.config.mode==='development')return 'development';
  if(!this.config.adUnitId)throw Error(this.text.unconfigured);
  if(typeof this.platform?.createRewardedVideoAd!=='function')throw Error(this.text.unsupported);
  this.busy=true;
  try{return await new Promise((resolve,reject)=>{
   let ad,settled=false;
   /** 即使创建、注册或播放同步抛错，也只移除本次请求自己的监听。 */
   const cleanup=()=>{for(const [method,handler]of [['offClose',close],['offError',fail]]){try{ad?.[method]?.(handler);}catch{}}};
   /** 先关闭回调入口再结算，避免重复关闭或晚到的播放失败触发第二条链路。 */
   const finish=(error,value)=>{if(settled)return;settled=true;cleanup();if(error)reject(error);else resolve(value);};
   const close=res=>finish(null,res?.isEnded===true);
   const fail=()=>finish(Error(this.text.failed));
   /** 包装同步和异步平台返回，失败后最多执行一次加载重试。 */
   const play=()=>{if(settled)return Promise.resolve();try{return Promise.resolve(ad.show());}catch(error){return Promise.reject(error);}};
   try{ad=this.platform.createRewardedVideoAd({adUnitId:this.config.adUnitId});ad.onClose(close);ad.onError(fail);play().catch(()=>{if(settled)return;Promise.resolve().then(()=>{if(!settled)return ad.load();}).then(()=>play()).catch(fail);});}catch(error){fail();}
  });}finally{this.busy=false;}
 }
}
module.exports={RewardedAds};
