'use strict';
/** 隔离真实激励广告与开发验收，失败和取消均不产生奖励凭据。 */
class RewardedAds{
 /** 注入平台与广告位配置，不硬编码真实广告位。 */
 constructor(platform,config){this.platform=platform;this.config=config;this.busy=false;}
 /** 真实广告必须收到 isEnded；开发模式由显式的测试弹窗负责模拟。 */
 async show(){if(this.busy)throw Error('广告播放中');if(this.config.mode==='development')return 'development';if(!this.config.adUnitId)throw Error('尚未配置激励广告位');this.busy=true;try{return await new Promise((resolve,reject)=>{const ad=this.platform.createRewardedVideoAd({adUnitId:this.config.adUnitId});const close=res=>{ad.offClose(close);ad.offError(fail);resolve(res?.isEnded===true);};const fail=err=>{ad.offClose(close);ad.offError(fail);reject(Error(err.errMsg||'广告加载失败'));};ad.onClose(close);ad.onError(fail);ad.show().catch(()=>ad.load().then(()=>ad.show()).catch(fail));});}finally{this.busy=false;}}
}
module.exports={RewardedAds};
