'use strict';
const c=require('./revive-config');
/** 仅当前最后一命的未结算战败可以请求复活。 */
function pending(m,id){const p=m.state.pending;if(!p||p.id!==id||p.training||p.battle.result!=='loss'||m.state.meta.hp>1)throw Error('复活机会已失效');return p;}
/** 保存首次截止时间，重绘不会重置十秒。 */
function open(m,id,now=Date.now()){return m.transact(()=>{const p=pending(m,id);if(!p.revive)p.revive={expires:now+c.seconds*1000};else if(p.revive.paused){p.revive.expires=now+p.revive.remaining;p.revive.paused=false;}return p.revive.expires;});}
/** 广告开始前冻结剩余时间，已超时不能发起新请求。 */
function pause(m,id,now=Date.now()){return m.transact(()=>{const r=pending(m,id).revive;if(!r||r.paused||r.expires<=now)throw Error('复活倒计时已结束');r.remaining=r.expires-now;r.paused=true;});}
/** 视频回执、赠将和回血在同一事务内完成，广告取消不会调用此入口。 */
function claim(m,id,ticket){return m.transact(()=>{const p=pending(m,id);if(!ticket||!p.revive?.paused)throw Error('请先完成复活视频');const node=m.state.meta.activeNode;const receipt=require('./defeat-reward').claim(m,id,ticket,true);m.state.meta.activeNode=node;m.state.meta.hp=c.fullHealth?m.progression.lord().hp:c.hp;return receipt;});}
/** 超时或主动放弃正常结算本次战败，再进入本局结算，不自动重开。 */
function surrender(m,id){return m.transact(()=>{pending(m,id);require('./defeat-reward').claim(m,id);return require('./run-settlement').surrender(m.progression);});}
module.exports={open,pause,claim,surrender};
