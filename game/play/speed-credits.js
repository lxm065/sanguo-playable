'use strict';
const c=require('./speed-credit-config');
/** 新旧存档只赠送一次，保留已有次数；重新开局不清除永久标记。 */
function initialize(m){if(m.state.meta.speedGiftGranted)return;m.transact(()=>{m.state.meta.inventory[c.item]=(m.state.meta.inventory[c.item]||0)+c.initial;m.state.meta.speedGiftGranted=true;});}
/** 单独分享序号防止重复回调；不复用邀请任务奖励。 */
function ticket(m){return m.state.meta.speedShareSerial||0;}
/** 完成分享生命周期后原子发放，不能用同一回执重复领取。 */
function share(m,serial){return m.transact(()=>{if(serial!==ticket(m))throw Error('本次分享奖励已领取');m.state.meta.speedShareSerial=serial+1;m.progression.add(c.item,c.reward);return c.reward;});}
module.exports={initialize,ticket,share};
