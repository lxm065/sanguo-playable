"use strict";
const config=require('./global-rank-config'),metric=require('./friend-rank-metric');
const alphabet='0123456789ABCDEFGHJKMNPQRSTVWXYZ';
/** 生成 ULID 幂等编号，不作为凭据或安全随机数使用。 */
function ulid(now=Date.now()){let s='',t=now;for(let i=0;i<10;i++){s=alphabet[t%32]+s;t=Math.floor(t/32);}for(let i=0;i<16;i++)s+=alphabet[Math.floor(Math.random()*32)];return s;}
/** 以独立持久化队列同步，成绩保持串行，未知提交先查后重试。 */
class GlobalRankRuntime{
 constructor(api,request=require('./backend-session').request){this.api=api;this.request=(path,data)=>request(config.path+path,data,api);this.running=false;this.timer=null;this.state={targets:{},sent:{},pending:{}};try{const old=api.getStorageSync(config.storageKey);if(old)this.state=JSON.parse(old);}catch{}this.state.targets||={};this.state.sent||={};this.state.pending||={};api.onShow?.(()=>this.flush());}
 /** 本地保存只观察已结算指标；未参与挑战不写挑战成绩。 */
 saved(state){if(!config.enabled)return;const s=metric.snapshot(state);this.state.targets.stage=s.stage;if(s.arena)this.state.targets.arena=s.arena.score;this.persist();if(!this.timer)this.timer=setTimeout(()=>{this.timer=null;this.flush();},config.debounceMs);}
 /** 队列写入失败应阻止发送，避免失去幂等编号。 */
 persist(){this.api.setStorageSync(config.storageKey,JSON.stringify(this.state));}
 /** 网络失败保留原编号；拒绝的旧成绩不无限重发。 */
 flush(){return this.flight||(this.flight=this.sync().finally(()=>{this.flight=null;}));}
 /** 单次串行批次只处理当前存档队列。 */
 async sync(){if(!config.enabled)return;this.running=true;let active=null;try{for(const key of Object.keys(config.metrics)){active=key;const target=this.state.targets[key];if(target===undefined)continue;let pending=this.state.pending[key];if(!pending&&this.state.sent[key]===target)continue;if(!pending){const data=await this.read(key);const stamp=Math.max(Date.now(),(this.state.lastStamp||0)+1);this.state.lastStamp=stamp;pending=this.state.pending[key]={submission_no:ulid(stamp),score:target,season:data.config.season.season_code,reset_revision:data.reset?.revision||'',occurred_at:new Date(stamp).toISOString()};this.persist();}let result;try{result=await this.request('/'+key+'/result',{submission_no:pending.submission_no});}catch(e){if(e.message!=='404')throw e;result=await this.request('/'+key+'/submit',pending);}this.state.sent[key]=pending.score;delete this.state.pending[key];this.error=null;this.persist();}}catch(e){if(e.code==='SCORE_REJECTED'){if(active&&this.state.pending[active]){this.state.sent[active]=this.state.pending[active].score;delete this.state.pending[active];}this.persist();}this.error='成绩暂未同步，请稍后刷新';}finally{this.running=false;if(Object.keys(this.state.targets).some(k=>this.state.pending[k]||this.state.sent[k]!==this.state.targets[k])&&!this.timer)this.timer=setTimeout(()=>{this.timer=null;this.flush();},config.retryMs);}}
 /** 榜单与个人排名来自同一后端快照，不生成虚构玩家。 */
 read(key){return this.request('/'+key+'/read',{});}
 /** 微信授权后仅上传平台返回的昵称头像。 */
 profile(info){return this.request('/profile/update',{nickname:info.nickName,avatar_url:info.avatarUrl||''});}
}
module.exports={GlobalRankRuntime,ulid};
