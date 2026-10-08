'use strict';
const c=require('./run-settlement-config');
/** 只依据已结算场次计算奖励，未结算战果和地图点击不增加收益。 */
function amount(model){return model.state.wins*c.perWin;}
/** 投降固定一次奖励快照并清除未领取战报；领取前不开始下一局。 */
function surrender(p){return p.model.transact(()=>{if(p.state.sectionReward)throw Error('请先领取通关奖励');if(p.state.runReward)return p.state.runReward;const m=p.model,s=p.state;s.runSerial=(s.runSerial||0)+1;s.runReward={id:s.runSerial,diamonds:amount(m),wins:m.state.wins,battles:m.state.battles};m.state.pending=null;m.state.expedition.adSerial++;s.hp=0;return s.runReward;});}
/** 普通与双倍互斥，发奖和重开在同一事务，存储失败保持完整待领奖状态。 */
function claim(p,id,ticket=null){return p.model.transact(()=>{const m=p.model,r=p.state.runReward;if(!r||r.id!==id)throw Error('本次结算已领取');if(ticket)m.consumeAd(ticket);else m.state.expedition.adSerial++;p.add('1',r.diamonds*(ticket?c.multiplier:1));p.state.runReward=null;p.restart();});}
module.exports={amount,surrender,claim};
