'use strict';
const c=require('./sign-config'),{random}=require('./combat');
/** 按累计签到次数选择本轮奖表，已发放记录仍优先展示，避免追溯改奖。 */
function rewardAt(day){const index=(day-1)%c.days.length,cycle=Math.floor((day-1)/c.days.length),table=c.cycleOverrides?.[cycle]||c.days,source={...table[index]};if(table===c.days&&source.lord&&cycle>0)source.lord='1006';return source;}
/** 每次抽取先保存具体物品，双倍补领复用已保存的抽取结果。 */
function resolve(p,reward){if((!reward.randomBlue&&!reward.randomPurple)||reward.item)return {...reward};const pool=reward.randomPurple?c.purplePool:c.bluePool,rng=random(p.model.state.seed++);return {...reward,item:pool[Math.floor(rng()*pool.length)]};}
/** 将旧版待确认碎片原子核销到仓库，重复加载不会再次补发。 */
function settleReserved(p){if(!p.state.signUnassigned?.length)return;return p.model.transact(()=>{const s=p.state;for(const entry of s.signUnassigned){const source=rewardAt(entry.day);let reward;if(s.signClaim?.date===entry.date&&s.signClaim.reward.day===entry.day){reward=resolve(p,{...source,...s.signClaim.reward,item:s.signClaim.reward.item||source.item});s.signClaim.reward=reward;}else reward=resolve(p,source);if(!reward.item)throw Error('签到补发配置缺失');if(!s.signRewards)s.signRewards={};s.signRewards[entry.day]={...reward};p.add(reward.item,entry.count);}s.signUnassigned=[];});}
/** 签到查询不补发旧档奖励，保留旧累计签到及主公解锁。 */
function status(p){const s=p.state,today=s.lastSign===p.day(),start=Math.floor(Math.max(0,s.signs-(today?1:0))/c.days.length)*c.days.length;return {today,start,day:today?s.signs:s.signs+1,record:s.signClaim,rows:c.days.map((r,i)=>({...rewardAt(start+i+1),...s.signRewards?.[start+i+1],day:start+i+1,displayDay:i+1,claimed:start+i+1<=s.signs,current:start+i+1===s.signs+1}))};}

/** 广告凭据绑定自然日及领奖序号，过期或重复回调不发奖。 */
function ticket(p){return {day:p.day(),signs:p.state.signs,serial:p.state.signSerial||0};}
/** 每日一次提前领取；兼容旧版本已看广告翻倍的当天记录。 */
function canAdvance(p){return p.state.signAdvanceDate!==p.day()&&!(p.state.signClaim?.date===p.day()&&p.state.signClaim.multiplier===2);}
/** 将下一个累计签到日的真实奖励入库，主公按累计天数解锁。 */
function grantNext(p){const s=p.state,day=s.signs+1,source={...rewardAt(day),day};const reward=resolve(p,source);if(!reward.lord)p.add(reward.item,reward.count);s.signs=day;s.lastSign=p.day();s.signRewards={...s.signRewards,[day]:reward};s.signClaim={date:p.day(),reward,multiplier:1};s.signSerial=(s.signSerial||0)+1;return s.signClaim;}
/** 普通领当天；视频在当天已领基础上多推进一天，未领当天则同事务领两天。 */
function claim(p,ad=null){return p.model.transact(()=>{if(ad&&JSON.stringify(ad)!==JSON.stringify(ticket(p)))throw Error('签到页面或日期已变化');if(ad&&!canAdvance(p))throw Error('今日已多领一天');if(!ad&&status(p).today)throw Error('今日奖励已领取');if(!status(p).today)grantNext(p);if(ad){grantNext(p);p.state.signAdvanceDate=p.day();}return p.state.signClaim;});}
module.exports={rewardAt,status,ticket,claim,settleReserved,canAdvance};
