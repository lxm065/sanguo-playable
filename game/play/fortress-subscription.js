'use strict';
/** 只能在用户点击建造或领取按钮的同步调用链内请求真实订阅；拒绝不影响玩法。 */
function request(api=typeof wx==='undefined'?null:wx,config=require('./fortress-subscription-config'),onAccepted=()=>{}){const ids=[...new Set(Object.values(config.templates).filter(Boolean))];if(!ids.length||!api?.requestSubscribeMessage)return false;const id=Date.now().toString(36)+'_'+Math.random().toString(36).slice(2)+'_'+Math.random().toString(36).slice(2);try{api.requestSubscribeMessage({tmplIds:ids,success(result){const accepted=require('./fortress-reminders').accepted(result,config.templates);if(accepted.length)onAccepted({id,accepted});},fail(){}});return true;}catch{return false;}}
/** 点击调用链中同步申请微信授权，回调绑定本次模型，避免切换存档后写错玩家任务。 */
function requestFor(progress,policy){return request(undefined,undefined,grant=>require('./fortress-reminders').enqueue(progress,policy,grant));}
module.exports={request,requestFor};
