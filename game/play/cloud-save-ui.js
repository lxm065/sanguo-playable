'use strict';
const config=require('./cloud-save-config');
/** 原生选择框直接比较两端章节；默认恢复云端，另一分支需明确选择保留本机。 */
function choose(api,{local,cloud}){return new Promise((resolve,reject)=>api.showModal({title:config.text.conflictTitle,content:'云端：'+summary(cloud)+'\n本机：'+summary(local)+'\n两份进度已备份，请选择需要继续的一份。',confirmText:config.text.cloudChoice,cancelText:config.text.localChoice,success:r=>resolve(r.confirm?'cloud':'local'),fail:()=>reject(Error(config.text.conflict))}));}
/** 展示可识别进度，不以设备时间或单一资源数量自动判断新旧。 */
function summary(value){return '第'+(value.meta?.chapter||1)+'章 第'+(value.meta?.section||1)+'节，已结算'+(value.battles||0)+'场';}
/** 临时网络状态完全静默；顶号、冲突或本机坏档仅提醒一次，后台任务不重复弹框。 */
function notify(api,cloud){if(!cloud.terminal||cloud.prompting||cloud.notifiedPhase===cloud.phase)return;cloud.prompting=true;cloud.notifiedPhase=cloud.phase;api.showModal({title:config.text.title,content:cloud.status(),showCancel:false,confirmText:config.text.exit,success:()=>{cloud.prompting=false;api.exitMiniProgram?.({});},fail:()=>{cloud.prompting=false;}});}
/** 在画面上沿更新不拦截触摸的小字，短暂丢包不显示，恢复后移除且不重绘玩家当前面板。 */
function indicator(v){
 if(v.cloudIndicator?.isValid){v.cloudIndicator.removeFromParent();v.cloudIndicator.destroy();}v.cloudIndicator=null;
 const cloud=v.cloudSave;if(!cloud||!['offline','checking'].includes(cloud.phase)||cloud.hidden)return;
 const c=config.indicator,u=v.ui,host=u.box(v.root,'cloud-sync-status',c.x,c.y,c.width,c.height,c.background,false);
 u.text(host,cloud.phase==='offline'?config.text.paused:config.text.checking,0,0,c.font,c.color,c.width,c.height);v.cloudIndicator=host;
}
/** 同步状态只刷新自身的小字，不关闭宝藏、领奖或布阵面板。 */
function update(v){indicator(v);notify(v.cloudSave.api,v.cloudSave);}
/** 事务等待由自动重连接管；保留原面板与未领取奖励，不再转成通用错误弹框。 */
function handleError(v,error){if(!v.cloudSave||!['CLOUD_SYNC_WAIT','CLOUD_SAVE_BLOCKED'].includes(error.code))return false;v.cloudSave.queueRetry();update(v);return true;}
/** 兼容只传文案的旧交互入口，避免同一同步状态再出现一层游戏内弹框。 */
function handleNotice(v,body){const cloud=v.cloudSave;if(!cloud||body!==cloud.status()||(!cloud.terminal&&!['offline','checking','reconnecting'].includes(cloud.phase)))return false;cloud.queueRetry();update(v);return true;}
/** 启动失败保留原档；连接重试复用当前会话，不创建临时空档。 */
function retry(api,error){return new Promise(resolve=>api.showModal({title:config.text.title,content:error.message===config.text.invalid||error.message===config.text.missing?error.message:config.text.offline,confirmText:config.text.retry,cancelText:config.text.exit,success:r=>{if(!r.confirm)api.exitMiniProgram?.({});resolve(!!r.confirm);},fail:()=>resolve(false)}));}
/** 头像面板展示同步状态，并提供手动提交入口。 */
function profile(v,card){const cloud=v.cloudSave;if(!cloud)return;const c=config.profile,u=v.ui;u.text(card,cloud.status(),0,c.statusY,c.statusFont,'#765D40',c.statusWidth,40);u.button(card,config.text.sync,0,c.buttonY,c.buttonWidth,async()=>{await cloud.resume();if(card.isValid)openProfile(v);},'#69552A',c.buttonHeight);}
/** 手动同步结束后重新构建头像面板，显示真实回执状态。 */
function openProfile(v){require('./profile-settings-view').open(v);}
module.exports={choose,notify,retry,profile,summary,indicator,update,handleError,handleNotice};
