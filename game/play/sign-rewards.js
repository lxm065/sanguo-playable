'use strict';
const c=require('./sign-config'),{random}=require('./combat');
/** 每次抽取先保存具体物品，双倍补领复用已保存的抽取结果。 */
function resolve(p,reward){if(!reward.randomBlue||reward.item)return {...reward};const rng=random(p.model.state.seed++);return {...reward,item:c.bluePool[Math.floor(rng()*c.bluePool.length)]};}
/** 将旧版待确认碎片原子核销到仓库，重复加载不会再次补发。 */
function settleReserved(p){if(!p.state.signUnassigned?.length)return;return p.model.transact(()=>{const s=p.state;for(const entry of s.signUnassigned){const index=(entry.day-1)%c.days.length;let reward;if(s.signClaim?.date===entry.date&&s.signClaim.reward.day===entry.day){reward=resolve(p,{...c.days[index],...s.signClaim.reward,randomBlue:c.days[index].randomBlue,item:s.signClaim.reward.item||c.days[index].item});s.signClaim.reward=reward;}else reward=resolve(p,c.days[index]);if(!reward.item)throw Error('签到补发配置缺失');if(!s.signRewards)s.signRewards={};s.signRewards[entry.day]={...reward};p.add(reward.item,entry.count);}s.signUnassigned=[];});}
/** 签到查询不补发旧档奖励，保留旧累计签到及主公解锁。 */
function status(p){const s=p.state,today=s.lastSign===p.day(),start=Math.floor(Math.max(0,s.signs-(today?1:0))/c.days.length)*c.days.length;return {today,start,day:today?s.signs:s.signs+1,record:s.signClaim,rows:c.days.map((r,i)=>({...r,...s.signRewards?.[start+i+1],day:start+i+1,lord:r.lord?(start===0?r.lord:'1006'):null,claimed:start+i+1<=s.signs,current:start+i+1===(today?s.signs:s.signs+1)}))};}
/** 广告绑定当日和签到进度；普通后允许补领一份，双倍后不能再次领。 */
function ticket(p){return {day:p.day(),signs:p.state.signs,serial:p.state.signSerial||0};}
/** 同一事务完成奖励、日期与累计天数，任何失败整体回滚。 */
function claim(p,ad=null){return p.model.transact(()=>{const s=p.state,q=status(p),t=ticket(p);if(ad&&JSON.stringify(ad)!==JSON.stringify(t))throw Error('签到页面或日期已变化');const again=q.today;if(again&&(!ad||!s.signClaim||s.signClaim.date!==p.day()||s.signClaim.multiplier!==1))throw Error('今日奖励已领取');const source=again?s.signClaim.reward:q.rows.find(r=>r.current);if(!source)throw Error('签到奖励不可用');const reward=resolve(p,source);if(reward.lord&&ad)throw Error('主公奖励不可翻倍');if(!again){s.signs++;s.lastSign=p.day();}if(!reward.lord){const count=reward.count*(ad&&!again?2:1);if(reward.item)p.add(reward.item,count);else{if(!s.signUnassigned)s.signUnassigned=[];s.signUnassigned.push({day:reward.day,date:p.day(),count});}}if(!s.signRewards)s.signRewards={};s.signRewards[s.signs]={...reward};s.signClaim={date:p.day(),reward:{...reward},multiplier:ad?2:1};s.signSerial=(s.signSerial||0)+1;return s.signClaim;});}
module.exports={status,ticket,claim,settleReserved};
