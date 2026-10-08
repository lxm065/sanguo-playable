"use strict";
const config=require('./game-club-config');
/** 隔离微信原生开放页面，避免将H5地址当作小游戏跳转参数。 */
class GameClubService{
 /** 平台与配置可注入，实例跨页面复用。 */
 constructor(platform,options=config){this.platform=platform;this.config=options;this.manager=null;this.loaded=false;this.opening=null;}
 /** 连点共用一次加载，失败销毁失效实例，下次点击可重试。 */
 open(){if(this.opening)return this.opening;if(!this.config.enabled||!this.config.openlink)return Promise.reject(Error(this.config.messages.unconfigured));if(typeof this.platform?.createPageManager!=='function')return Promise.reject(Error(this.config.messages.unsupported));this.opening=Promise.resolve().then(()=>{if(!this.manager)this.manager=this.platform.createPageManager();return this.loaded?null:this.manager.load({openlink:this.config.openlink});}).then(()=>{this.loaded=true;return this.manager.show();}).then(()=>true).catch(error=>{this.loaded=false;try{this.manager?.destroy?.();}catch(_){}this.manager=null;const code=Number(error?.errCode??error?.code);throw Error(code===-8?this.config.messages.environment:code===-3?this.config.messages.deviceUnsupported:code===-2?this.config.messages.unsupported:this.config.messages.failed);}).finally(()=>{this.opening=null;});return this.opening;}
}
module.exports={GameClubService};
