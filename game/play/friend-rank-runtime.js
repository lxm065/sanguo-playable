'use strict';
const c=require('./friend-rank-config'),metric=require('./friend-rank-metric');
/** 微信能力端口只传成绩和界面指令，好友资料始终留在开放数据域。 */
class FriendRankRuntime{
 /** 注入微信端口便于离线验证权限和迟到回调，不绑定任何测试模型。 */
 constructor(api){this.api=api;this.scores={stage:0,arena:null};this.metric='stage';this.allowed=false;this.visible=false;this.generation=0;this.onState=null;this.foreground=()=>{if(!this.busy)this.check();};}
 /** 启动仅查询已有授权，不主动弹出隐私或关系链授权。 */
 initialize(state){this.saved(state);this.api.onShow?.(this.foreground);this.api.onHide?.(this.background=()=>{if(!this.busy)this.generation++;this.allowed=false;this.post('hide');});this.check();}
 /** 只从真实存储成功回调获取分数；隔离 UI 模型不会写入微信云成绩。 */
 saved(state){const value=metric.snapshot(state);value.stage=Math.max(value.stage,this.scores.stage);if(JSON.stringify(value)===JSON.stringify(this.scores))return;this.scores=value;if(this.allowed)this.post('sync');}
 /** 包装微信回调并限制等待时间；超时不能把失败当成功。 */
 call(name,args={}){return new Promise((resolve,reject)=>{if(typeof this.api[name]!=='function'){reject(Error('微信版本暂不支持，请更新微信'));return;}const timer=setTimeout(()=>reject(Error('微信响应超时，请重试')),c.timeoutMs);try{this.api[name]({...args,success:r=>{clearTimeout(timer);resolve(r);},fail:()=>{clearTimeout(timer);reject(Error('微信授权或读取失败，请重试'));}});}catch(e){clearTimeout(timer);reject(e);}});}
 /** 显示主域权限状态；授权成功后才展示共享画布。 */
 state(kind,message){this.onState?.({kind,message});}
 /** 每次打开、回前台都重新核验隐私与好友互动两层权限。 */
 async check(){const token=++this.generation;this.allowed=false;this.post('hide');this.state('checking','正在检查微信授权…');try{const [privacy,settings]=await Promise.all([this.call('getPrivacySetting'),this.call('getSetting')]);if(token!==this.generation)return;const grant=settings.authSetting?.[c.scope];if(privacy.needAuthorization||grant!==true){this.state(grant===false?'denied':'authorize','授权后查看好友关卡和排位成绩');return;}this.allowed=true;this.state('ready','');this.post(this.visible?'show':'sync');}catch(e){if(token===this.generation)this.state('error',e.message);}}
 /** 玩家主动点击后才启动微信官方隐私弹窗及好友互动授权。 */
 async authorize(){if(this.busy)return;this.busy=true;const token=++this.generation;this.state('checking','请完成微信授权…');try{await this.call('requirePrivacyAuthorize');if(token!==this.generation)return;await this.call('authorize',{scope:c.scope});if(token===this.generation)await this.check();}catch(e){if(token===this.generation)this.state('denied','未获得授权，可前往微信设置开启好友互动');}finally{this.busy=false;}}
 /** 已拒绝的权限通过微信设置恢复，返回后再读取真实授权状态。 */
 async settings(){if(this.busy)return;this.busy=true;const token=++this.generation;try{await this.call('openSetting');if(token===this.generation)await this.check();}catch(e){if(token===this.generation)this.state('error',e.message);}finally{this.busy=false;}}
 /** 打开界面仅注册本次监听，关闭后旧授权结果不能重新展示列表。 */
 open(listener){this.visible=true;this.onState=listener;this.check();}
 /** 开放数据域不提供业务回传，主域不试图接收好友数据或读取画布像素。 */
 post(action,extra={}){try{if(!this.api.getOpenDataContext)throw Error('unsupported');this.api.getOpenDataContext().postMessage({channel:c.channel,action,scores:this.scores,metric:this.metric,...extra});}catch(e){this.state('error','开放数据域不可用，请重试');}}
 /** 两个榜单独立选择，切换后重新核验权限并清除旧好友列表。 */
 select(metric){if(!c.metrics[metric])return;this.metric=metric;this.check();}
 /** 翻页仅传增量，不向主域暴露排行榜记录。 */
 page(delta){if(this.allowed&&this.visible)this.post('page',{delta});}
 /** 关闭窗口使所有在途授权失效，并清理子域可见好友信息。 */
 close(){this.visible=false;this.onState=null;this.generation++;this.post('hide');}
 /** 生命周期结束时成对移除微信事件监听。 */
 destroy(){this.close();this.api.offShow?.(this.foreground);this.api.offHide?.(this.background);}
}
module.exports={FriendRankRuntime};
