"use strict";
const data=require('./vip-data'),c=require('./vip-config');
/** 旧档读取零积分视图，查询不创建字段或写盘。 */
function state(m){return m.state.meta?.vip||{points:0,day:'',earned:0,serial:0,gifts:[],daily:''};}
/** 按累计积分查询等级，24级封顶。 */
function level(m){return data.filter(r=>state(m).points>=r.vip_exp).at(-1).VIP_id;}
/** 从同一张原表提供战斗、商店和UI权益数值。 */
function perks(m){return {...data[level(m)],data_2:require('./speed-credit-config').reward};}
/** 查询每日剩余积分，满级仍保留计分上限。 */
function remaining(m){const s=state(m);return Math.max(0,c.dailyCap-(s.day===m.progression.day()?s.earned:0));}
/** 写入只发生在外层事务内部。 */
function writable(m){if(!m.state.meta.vip)m.state.meta.vip={...state(m),gifts:[]};return m.state.meta.vip;}
/** 广告请求绑定当日和单调序号。 */
function ticket(m){return {day:m.progression.day(),serial:state(m).serial};}
/** 每个成功的完整广告业务仅记一次积分；旧回调和跨日回调被拒绝。 */
function recordAd(m,t){const s=writable(m);if(!t||t.day!==m.progression.day()||t.serial!==s.serial)throw Error('广告请求已过期');if(s.day!==t.day){s.day=t.day;s.earned=0;}s.serial++;if(s.earned<c.dailyCap){s.earned+=c.pointsPerAd;s.points+=c.pointsPerAd;}}
/** 钻石奖励统一向下取整；退款与VIP固定礼包可显式跳过加成。 */
function diamonds(m,n){return Math.floor(n*(1+perks(m).data_5/10000));}
/** 等级礼包与每日礼包独立防重；以当前等级领取每日礼包。 */
function claim(m,kind,index=level(m)){return m.transact(()=>{const s=writable(m);if(kind==='daily'){if(s.daily===m.progression.day())throw Error('今日礼包已领取');index=level(m);s.daily=m.progression.day();}else if(kind==='level'){if(!data[index]||index>level(m)||s.gifts.includes(index))throw Error('礼包未解锁或已领取');s.gifts.push(index);}else throw Error('未知礼包');return require('./activity-rewards').grant(m,data[index][kind==='daily'?'daily':'gift'],1,false);});}
/** 只对未领取的已解锁礼包亮红点，积分获取入口不常亮。 */
function ready(m){const s=state(m);return s.daily!==m.progression.day()||data.some(r=>r.VIP_id<=level(m)&&!s.gifts.includes(r.VIP_id));}
/** 视频获取的加速卡来自当前VIP权益；发奖由广告外层事务提交。 */
function speedReward(m){const n=require('./speed-credit-config').reward;m.progression.add(c.speedItem,n);return {[c.speedItem]:n};}
/** 加速按一场战斗消耗一张；同一战斗切换倍速不会重复扣除。 */
function useSpeed(m){return m.transact(()=>{require("./battle-speed-policy").assertUnlocked(m);const e=m.state.expedition;if(e.vipSpeedActive)return true;const bag=m.state.meta.inventory;if((bag[c.speedItem]||0)<1)throw Error('加速卡不足');bag[c.speedItem]--;e.vipSpeedActive=true;return true;});}
module.exports={state,level,perks,remaining,ticket,recordAd,diamonds,claim,ready,speedReward,useSpeed};
