"use strict";
const registry=require('./share-scenarios'),config=require('./activity-config');
/** 查询当日状态，旧档或跨日只返回视图，不写入存档。 */
function status(model){const a=model.activities,s=a.state.share;return s?.day===a.day()?s:{day:a.day(),inviteCount:0,shareReward:false,milestones:[]};}
/** 入口资格与结算共用每日限制。 */
function available(model,source){const scenario=registry.scenarios[source];if(!scenario)return false;return scenario.bucket==='daily'?model.activities.daily().find(t=>t.id==='share').count<scenario.limit:status(model).inviteCount<scenario.limit;}
/** 请求绑定日期与单调序号，拒绝隔日或重复完成。 */
function ticket(model){return {day:model.activities.day(),serial:model.activities.state.shareSerial||0};}
/** 软校验成功后原子记录进度与奖励，不伪造好友身份。 */
function complete(model,source,token){return model.transact(()=>{const a=model.activities;if(!token||token.day!==a.day()||token.serial!==(a.state.shareSerial||0))throw Error('分享请求已过期，请重试');if(!available(model,source))throw Error(registry.text.limit);a.reset();const s=JSON.parse(JSON.stringify(status(model)));a.state.share=s;a.state.shareSerial=(a.state.shareSerial||0)+1;if(!a.daily().find(t=>t.id==='share').count)a.record('share');const items={};if(registry.scenarios[source].bucket==='invite'){s.inviteCount++;if(!s.shareReward){s.shareReward=true;merge(items,config.invite.shareRewards);}for(const n of config.invite.targets)if(s.inviteCount>=n&&!s.milestones.includes(n)){s.milestones.push(n);merge(items,config.invite.rewards);}}return require('./activity-rewards').grant(model,items);});}
/** 聚合达标奖励，避免多次发放造成部分提交。 */
function merge(target,items){for(const [id,count]of Object.entries(items))target[id]=(target[id]||0)+count;}
module.exports={status,available,ticket,complete};
