'use strict';
/** 共用建筑生命周期：章节门槛、绝对时间、容量、分享凭据与原子领取。 */
class FortressBuilding{
 /** 注入进度服务与建筑策略；不同建筑存档互不覆盖。 */
 constructor(progress,config){this.progress=progress;this.config=config;}
 /** 等级生产加速按建筑策略换算周期；未配置的建筑保持原周期。 */
 period(level){return this.config.production.seconds*1000/(1+level*(this.config.production.speedPercentPerLevel||0)/100);}
 /** 完成本地事务后同步提醒；网络故障由持久化 outbox 重试。 */
 mutate(action){const result=this.progress.model.transact(action);require('./fortress-reminders').enqueue(this.progress,this.config);return result;}
 /** 消费和领取均重新验证永久通关记录。 */
 gate(){if(this.progress.state.cleared<this.config.chapter)throw Error('通关第'+this.config.chapter+'章解锁'+this.config.name);}
 /** 到期结算保留时间余量；库存满后暂停积累，不能离线无限领取。 */
 sync(){const p=this.progress.state,c=this.config,now=this.progress.clock(),key=c.stateKey;let s=p[key];if(!s)s=p[key]={level:Math.max(0,Math.min(p[c.legacyLevel]||0,c.levels.length-1)),ready:0,nextAt:now+c.production.seconds*1000,serial:0};if(s.build&&now>=s.build.end){s.level=s.build.level;s.nextAt=s.build.end;delete s.build;}if(c.legacyLevel)p[c.legacyLevel]=s.level;if(s.day!==this.progress.day()){s.day=this.progress.day();s.buildSpeeds=0;s.productionSpeeds=0;}const capacity=c.levels[s.level].max,period=this.period(s.level);if(s.level&&s.ready<capacity&&now>=s.nextAt){const elapsed=1+Math.floor((now-s.nextAt)/period);s.ready=Math.min(capacity,s.ready+elapsed);s.nextAt=s.ready===capacity?now+period:s.nextAt+elapsed*period;}return s;}
 /** 在隔离的建筑状态上计算到期及红点，不写盘、不增加模型事务版本。 */
 attention(){const p=this.progress,c=this.config,state={...p.state},saved=state[c.stateKey];if(saved)state[c.stateKey]={...saved,build:saved.build?{...saved.build}:undefined};const preview=new FortressBuilding({state,clock:()=>p.clock(),day:()=>p.day()},c),s=preview.sync(),unlocked=state.cleared>=c.chapter,next=c.levels[s.level+1];return {claim:unlocked&&s.level>0&&s.ready>0,upgrade:unlocked&&!s.build&&!!next&&state.cleared>=next.chapter&&state.diamonds>=c.levels[s.level].exp};}
 /** 返回快照，UI只能通过事务入口更改生产状态。 */
 status(){return this.progress.model.transact(()=>{const s=this.sync();return {...s,build:s.build?{...s.build}:null};});}
 /** 建造与升级消耗按原表读取，失败不留下半次扣款。 */
 start(){return this.mutate(()=>{this.gate();const s=this.sync(),c=this.config,current=c.levels[s.level],next=c.levels[s.level+1];if(s.build)throw Error('工坊正在建造中');if(!next)throw Error('建筑已满级');if(this.progress.state.cleared<next.chapter)throw Error('通关第'+next.chapter+'章可升级');if(this.progress.state.diamonds<current.exp)throw Error('钻石不足');this.progress.state.diamonds-=current.exp;const now=this.progress.clock();s.build={level:s.level+1,start:now,end:now+current.time*1000};s.serial++;if(c.guideFlag)this.progress.state[c.guideFlag]=true;});}
 /** 领取后启动下一轮冷却，旧分享凭据随序号失效。 */
 claim(){return this.mutate(()=>{this.gate();const s=this.sync();if(!s.level||!s.ready)throw Error('暂无可领取产出');const amount=s.ready*this.config.production.diamonds;s.ready=0;s.nextAt=this.progress.clock()+this.period(s.level);s.serial++;this.progress.add(this.config.production.item,amount,false);return amount;});}
 /** 绑定当前建筑、日期、建造任务与领取序号，拒绝跨建筑或迟到回调。 */
 ticket(kind){const s=this.status();return {building:this.config.stateKey,kind,serial:s.serial,day:s.day,buildEnd:s.build?.end||null};}
 /** 视频缩短建造，分享令当前产出就绪；平台取消和重复回调不能发奖。 */
 speed(token,completed){return this.mutate(()=>{this.gate();const s=this.sync(),c=this.config.production;if(!completed||!token||token.building!==this.config.stateKey||token.serial!==s.serial||token.day!==s.day||token.buildEnd!==(s.build?.end||null))throw Error('加速请求未完成或已过期');if(token.kind==='build'){if(!s.build)throw Error('当前没有建造任务');if(s.buildSpeeds>=c.dailyBuildSpeeds)throw Error('今日建造加速次数已用完');s.buildSpeeds++;s.build.end=Math.max(this.progress.clock(),s.build.end-c.buildSpeedSeconds*1000);}else if(token.kind==='production'){if(!s.level||s.ready>=this.config.levels[s.level].max)throw Error('请先领取产出');if(s.productionSpeeds>=c.dailyProductionSpeeds)throw Error('今日生产加速次数已用完');s.productionSpeeds++;if(c.instantProduction){s.ready++;s.nextAt=this.progress.clock()+this.period(s.level);}else s.nextAt-=c.productionSpeedSeconds*1000;}else throw Error('未知加速类型');s.serial++;this.sync();});}
 /** 矿场原有引导兼容入口，其他建筑不复用首建教学。 */
 guide(){const p=this.progress.state,c=this.config;return !!c.guideFlag&&p.cleared>=c.chapter&&!p[c.guideFlag]&&!p[c.legacyLevel]&&!p[c.stateKey]?.build&&!p.sectionReward&&!p.runReward&&!this.progress.model.state.pending;}
}
module.exports={FortressBuilding};
