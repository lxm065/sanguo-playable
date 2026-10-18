'use strict';
const config=require('./lord-unlock-config');
/** 永久章节和签到门槛同时满足才允许招募，读取不改存档。 */
function ready(progress,id){const lord=progress.lord(id),m=progress.state;return !!lord&&m.cleared>=lord.chapter&&m.signs>=lord.sign;}
/** 完整视频进度保存在局外，重开远征不会清零。 */
function count(progress,id){return Math.min(config.entries[id]?.videos||0,Math.max(0,Math.floor(progress.state.lordRecruitment?.[id]||0)));}
/** 选择和技能实际入口共用解锁判断，不能由显示标记绕过。 */
function unlocked(progress,id){const entry=config.entries[id];return ready(progress,id)&&(!entry||count(progress,id)>=entry.videos);}
/** 仅迁移旧版已经在使用的合法主公，未选中的主公仍需招募。 */
function initialize(progress){if(progress.state.lordRecruitment)return;progress.model.transact(()=>{progress.state.lordRecruitment={};const id=progress.state.lord;if(config.entries[id]&&ready(progress,id))progress.state.lordRecruitment[id]=config.entries[id].videos;});}
/** 捕获本次招募次数与广告流水，过期回调不得消耗下一次机会。 */
function ticket(progress,id){return {id,count:count(progress,id),ad:progress.model.adTicket()};}
/** 只由完整观看回调调用；凭据消费、招募进度和获得提示原子保存。 */
function recruit(progress,id,credential){return progress.model.transact(()=>{const entry=config.entries[id];if(!entry||!ready(progress,id))throw Error('请先通关指定章节');if(unlocked(progress,id))throw Error('主公已经招募');if(!credential||credential.id!==id||credential.count!==count(progress,id))throw Error('招募进度已变化');progress.model.consumeAd(credential.ad);const next=count(progress,id)+1;progress.state.lordRecruitment={...progress.state.lordRecruitment,[id]:next};if(next===entry.videos)progress.state.lordRecruitNotice=id;return next===entry.videos;});}
module.exports={ready,count,unlocked,initialize,ticket,recruit};
