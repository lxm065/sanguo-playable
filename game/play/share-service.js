"use strict";
const config=require('./activity-config').share,registry=require('./share-scenarios');
/** 统一微信生命周期管理器，只验证离开返回流程，不证明群分享。 */
class ShareService{
 /** 注入时钟和计时器便于模拟，平台层不持有玩家奖励。 */
 constructor(platform,deps={}){this.platform=platform;this.now=deps.now||Date.now;this.schedule=deps.schedule||setTimeout;this.clear=deps.clear||clearTimeout;this.initialized=false;this.pending=null;this.hide=this.handleHide.bind(this);this.show=this.handleShow.bind(this);}
 /** 菜单和生命周期仅注册一次，菜单分享不触发业务奖励。 */
 initialize(){if(this.initialized)return;this.initialized=true;this.platform?.showShareMenu?.({withShareTicket:true,menus:['shareAppMessage']});this.platform?.onShareAppMessage?.(()=>this.payload('menu'));this.platform?.onHide?.(this.hide);this.platform?.onShow?.(this.show);}
 /** 白名单来源不携带虚构好友身份。 */
 payload(source){const entry=config.sources.includes(source)?source:'menu';return {title:config.title,query:'source='+encodeURIComponent(entry),...(config.imageUrl?{imageUrl:config.imageUrl}:{})};}
 /** 无奖励菜单兼容入口保持原生点击调用链。 */
 open(source){if(typeof this.platform?.shareAppMessage!=='function')throw Error(config.unavailable);this.platform.shareAppMessage(this.payload(source));}
 /** 请求锁覆盖全流程，失败、超时均释放。 */
 request(source,callback){if(this.pending){callback({ok:false,reason:'busy'});return false;}if(!registry.scenarios[source]||!['shareAppMessage','onHide','onShow'].every(k=>typeof this.platform?.[k]==='function')){callback({ok:false,reason:'unavailable'});return false;}this.initialize();this.pending={startedAt:this.now(),hiddenAt:null,callback};this.timer=this.schedule(()=>this.finish(false,'timeout'),registry.timeoutMs);try{this.open(source);return true;}catch(error){this.finish(false,'failed');return false;}}
 /** 重复隐藏事件不延长截止时间。 */
 handleHide(){if(this.pending&&this.pending.hiddenAt===null)this.pending.hiddenAt=this.now();}
 /** 返回时检查总超时，避免后台计时器暂停导致迟到发奖。 */
 handleShow(){const p=this.pending;if(!p)return;if(this.now()-p.startedAt>=registry.timeoutMs)return this.finish(false,'timeout');if(p.hiddenAt===null)return this.finish(false,'no_hide');const ok=this.now()-p.hiddenAt>=registry.minHideMs;this.finish(ok,ok?'completed':'too_fast');}
 /** 回调前释放锁和定时器，重复事件不能再次完成。 */
 finish(ok,reason){const p=this.pending;if(!p)return;this.pending=null;this.clear(this.timer);this.timer=null;p.callback({ok,reason});}
 /** 销毁时静默取消迟到回调并解绑监听。 */
 destroy(){this.pending=null;this.clear(this.timer);this.platform?.offHide?.(this.hide);this.platform?.offShow?.(this.show);this.initialized=false;}
}
module.exports={ShareService};
