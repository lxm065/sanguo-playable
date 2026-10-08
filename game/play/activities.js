'use strict';
const c=require('./activity-config'),{random}=require('./combat');
/** 局外活动共享战役事务，日界线使用进度服务时钟，跨远征保留长期成长。 */
class Activities{
 /** 仅补齐新字段，不回溯推算旧日常任务。 */
 constructor(model){this.model=model;if(!this.state)model.transact(()=>{model.state.meta.activities={day:this.day(),counts:{},claimed:[],adUsed:0,talent:{level:0,levels:c.talent.entries.map(()=>0),points:0},serial:0};});}
 /** 每次读取当前事务状态，避免回滚后引用旧对象。 */
 get state(){return this.model.state.meta.activities;}
 /** 统一活动重置日期。 */
 day(){return this.model.progression.day();}
 /** 新日期只重置日任务和免费强化次数。 */
 reset(){if(this.state.day!==this.day()){Object.assign(this.state,{day:this.day(),counts:{},claimed:[],adUsed:0});this.state.serial++;}}
 /** 战斗奖励、装备入库和合成在原事务中记录，失败会共同回滚。 */
 record(id,count=1){if(id==='merge4')require('./war-order').record(this.model,count);this.reset();this.state.counts[id]=(this.state.counts[id]||0)+count;}
 /** 查询今日进度，不在打开页面时写存档。 */
 daily(){const current=this.state.day===this.day();return c.daily.map(t=>({...t,count:current?this.state.counts[t.id]||0:0,claimed:current&&this.state.claimed.includes(t.id)}));}
 /** 广告回调绑定日期和序号，防止隔日或重复发奖。 */
 ticket(){const day=this.day();return {day,serial:this.state.serial+(this.state.day===day?0:1)};}
 /** 消费完成回调凭据；此方法仅由广告完整观看的回调调用。 */
 consume(ticket){if(!ticket||ticket.day!==this.day()||ticket.serial!==this.state.serial)throw Error('奖励已领取或日期已变化');this.state.serial++;}
 /** 达标后普通或双倍只能领取其一，余额更新由同一事务提交。 */
 claim(id,ticket=null){return this.model.transact(()=>{this.reset();const t=this.daily().find(v=>v.id===id);if(!t||t.claimed||t.count<t.target)throw Error('未达成领取条件或已领取');if(ticket)this.consume(ticket);const items=require('./activity-rewards').grant(this.model,c.rewards,ticket?2:1);this.state.claimed.push(id);return items;});}
 /** 判断累计八项等级是否达到突破条件。 */
 canBreak(){return Math.floor(this.state.talent.levels.reduce((a,b)=>a+b,0)/c.talent.breakEvery)>this.state.talent.level;}
 /** 蓄水进度每八次归一，突破前保持满格。 */
 fill(){return Math.min(1,Math.max(0,(this.state.talent.levels.reduce((a,b)=>a+b,0)-this.state.talent.level*c.talent.breakEvery)/c.talent.breakEvery));}
 /** 费用随天赋等级成长，突破使用同级强化价的两倍。 */
 cost(){return (c.talent.cost+Math.max(0,this.state.talent.level-1)*c.talent.costPerLevel)*(this.canBreak()?c.talent.breakMultiplier:1);}
 /** 等概率强化一项或执行突破；扣费、随机种子、升级和广告次数原子保存。 */
 enhance(mode='gold',ticket=null){return this.model.transact(()=>{this.model.editable();this.reset();if(!['gold','ad','dust'].includes(mode))throw Error('无效强化方式');const s=this.state,p=this.model.state.meta,breaking=this.canBreak();if(breaking&&mode!=='gold')throw Error('请先突破天赋');if(mode==='gold'){const cost=this.cost();if(p.diamonds<cost)throw Error('钻石不足');p.diamonds-=cost;}else if(mode==='ad'){if(s.adUsed>=c.talent.adLimit)throw Error('今日免费次数已用完');this.consume(ticket);s.adUsed++;}else{if(s.adUsed<c.talent.adLimit)throw Error('请先使用今日免费次数');if((p.inventory['5']||0)<c.talent.dustCost)throw Error('军略丹不足');p.inventory['5']-=c.talent.dustCost;}if(breaking){s.talent.level++;s.talent.points++;return {kind:'break',label:'天赋突破成功 · 天赋点 +1'};}const index=Math.floor(random(this.model.state.seed++)()*c.talent.entries.length);s.talent.levels[index]++;return {kind:'upgrade',index,level:s.talent.levels[index],label:c.talent.entries[index][0]+' +1'};});}
 /** 为战斗创建只读增益快照，敌方不读取玩家天赋。 */
 bonuses(){return Object.fromEntries(c.talent.entries.map((e,i)=>[e[2],this.state.talent.levels[i]*c.talent.step]));}
}
module.exports={Activities};
