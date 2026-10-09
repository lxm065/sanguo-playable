'use strict';
const c=require('./sweep-config');
/** 未补充后续章奖表时沿用最近已配置章节；不自行放大奖励。 */
function chapterReward(chapter){const key=Object.keys(c.chapterRewards).map(Number).filter(n=>n<=chapter).sort((a,b)=>b-a)[0];return {...c.chapterRewards[key],...c.chapterBonus};}
/** 按日期读取剩余次数，查询界面不重置或写入存档。 */
function status(p){const day=p.day(),s=p.state.sweep,used=s?.day===day?s.used:0;return {day,used,remaining:Math.max(0,c.daily+require('./vip').perks(p.model).data_3-used),free:used<c.free+require('./vip').perks(p.model).data_3,unlocked:p.state.cleared>=c.unlockChapter,pending:s?.pending};}
/** 广告绑定日期与次数，跨日及重复回调不消费新一天额度。 */
function ticket(p){const s=status(p);return {...p.model.adTicket(),day:s.day,used:s.used};}
/** 扫荡先保存固定奖励再占用一次额度，退出重载可继续领取。 */
function begin(p,t=null){return p.model.transact(()=>{const s=status(p);if(!s.unlocked)throw Error('通关第一章后开启扫荡');if(s.pending)throw Error('请先领取扫荡奖励');if(p.state.sectionReward||p.state.runReward)throw Error('请先领取结算奖励');if(!s.remaining)throw Error('今日扫荡次数已用完');if(t){if(t.day!==s.day||t.used!==s.used)throw Error('扫荡日期或次数已变化');p.model.consumeAd(t);}else if(!s.free)throw Error('请完整观看视频后扫荡');const last=p.state.lastClearReward||{chapter:p.state.cleared,items:chapterReward(p.state.cleared)},serial=(p.state.sweep?.serial||0)+1;p.state.sweep={day:s.day,used:s.used+1,serial,pending:{id:serial,chapter:last.chapter,items:withoutBonus(last.items)}};return p.state.sweep.pending;});}
/** 普通与视频双倍互斥发放，成功后清除快照；写盘失败整体回滚。 */
function claim(p,id,t=null){return p.model.transact(()=>{const r=p.state.sweep?.pending;if(!r||r.id!==id)throw Error('扫荡奖励已领取');if(t)p.model.consumeAd(t);else p.model.state.expedition.adSerial++;for(const [key,n]of Object.entries(withoutBonus(r.items)))p.add(key,n*(t?c.multiplier:1));p.state.sweep.pending=null;});}
/** 取消旧版本未领取快照中的章节招贤钱，已入库物品不回收。 */
function withoutBonus(items){const result={...items};for(const id of c.excludedChapterItems)delete result[id];return result;}
module.exports={withoutBonus,chapterReward,status,ticket,begin,claim};
