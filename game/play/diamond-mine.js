'use strict';
const config=require('./diamond-mine-config');
/** 服务只负责矿场事务，时钟复用进度服务以支持离线计时与测试。 */
class DiamondMine{
 /** 注入进度与数值配置，不持有 UI 或平台对象。 */
 constructor(progress,c=config){this.progress=progress;this.config=c;}
 /** 所有消费、加速与领取均重新检查永久通关记录。 */
 gate(){if(this.progress.state.cleared<this.config.chapter)throw Error('通关第'+this.config.chapter+'章解锁钻石矿场');}
 /** 在事务内迁移旧档，并按绝对时间结算建造和有限容量产出。 */
 sync(){const p=this.progress.state,c=this.config,now=this.progress.clock();if(!p.diamondMine)p.diamondMine={level:Math.max(0,Math.min(p.mineLevel||0,c.levels.length-1)),ready:0,nextAt:now+c.production.seconds*1000,serial:0};const s=p.diamondMine;if(s.build&&now>=s.build.end){s.level=s.build.level;s.nextAt=s.build.end;c.levels[s.level]&&delete s.build;}p.mineLevel=s.level;if(s.day!==this.progress.day()){s.day=this.progress.day();s.buildSpeeds=0;s.productionSpeeds=0;}const capacity=c.levels[s.level].max;if(s.level>0&&now>=s.nextAt){const elapsed=1+Math.floor((now-s.nextAt)/(c.production.seconds*1000));s.ready=Math.min(capacity,s.ready+elapsed);s.nextAt=now+c.production.seconds*1000;}return s;}
 /** 查询也持久化到期结果，避免重绘或重启重复产出。 */
 status(){return this.progress.model.transact(()=>({...this.sync(),build:this.progress.state.diamondMine.build?{...this.progress.state.diamondMine.build}:null}));}
 /** 只在事务全部成功后扣款，重复点击或伪造旧等级无法绕过章节门槛。 */
 start(){return this.progress.model.transact(()=>{this.gate();const s=this.sync(),c=this.config,current=c.levels[s.level],next=c.levels[s.level+1];if(s.build)throw Error('工坊正在建造中');if(!next)throw Error('矿场已满级');if(this.progress.state.cleared<next.chapter)throw Error('通关第'+next.chapter+'章可升级');if(this.progress.state.diamonds<current.exp)throw Error('钻石不足');this.progress.state.diamonds-=current.exp;s.build={level:s.level+1,start:this.progress.clock(),end:this.progress.clock()+current.time*1000};s.serial++;this.progress.state.mineGuideDone=true;});}
 /** 领取与清空库存使用同一事务，避免重复领取并保持截图中的实际数量。 */
 claim(){return this.progress.model.transact(()=>{this.gate();const s=this.sync();if(!s.level||!s.ready)throw Error('暂无可领取钻石');const amount=s.ready*this.config.production.diamonds;s.ready=0;this.progress.add('1',amount,false);return amount;});}
 /** 将异步平台结果绑定当前建造、日期与序号，拒绝重放。 */
 ticket(kind){const s=this.status();return {kind,serial:s.serial,day:s.day,buildEnd:s.build?.end||null};}
 /** 仅平台完成回调可传入凭据；失败、过期和当日超限均不缩短计时。 */
 speed(token,completed){return this.progress.model.transact(()=>{this.gate();const s=this.sync(),c=this.config.production;if(!completed||!token||token.serial!==s.serial||token.day!==s.day||token.buildEnd!==(s.build?.end||null))throw Error('加速请求未完成或已过期');if(token.kind==='build'){if(!s.build)throw Error('当前没有建造任务');if(s.buildSpeeds>=c.dailyBuildSpeeds)throw Error('今日建造加速次数已用完');s.buildSpeeds++;s.build.end=Math.max(this.progress.clock(),s.build.end-c.buildSpeedSeconds*1000);}else if(token.kind==='production'){if(!s.level||s.ready>=this.config.levels[s.level].max)throw Error('请先领取矿场产出');if(s.productionSpeeds>=c.dailyProductionSpeeds)throw Error('今日生产加速次数已用完');s.productionSpeeds++;s.nextAt-=c.productionSpeedSeconds*1000;}else throw Error('未知加速类型');s.serial++;this.sync();});}
 /** 未建造的已通关玩家可恢复引导，低章旧档标记不能激活。 */
 guide(){const p=this.progress.state;return p.cleared>=this.config.chapter&&!p.mineGuideDone&&!p.mineLevel&&!p.diamondMine?.build&&!p.sectionReward&&!p.runReward&&!this.progress.model.state.pending;}
}
module.exports={DiamondMine};
