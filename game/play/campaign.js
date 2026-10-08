'use strict';
const {random,simulate}=require('./combat');
/** JSON 值拷贝用于事务回滚与存档，UI 无权持有可写存储对象。 */
function copy(value){return JSON.parse(JSON.stringify(value));}
class Campaign{
 /** 注入规则、阵容表和存储端口；损坏存档必须显式报错。 */
 constructor(rules,roster,storage){this.rules=rules;this.roster=roster;this.storage=storage;const saved=storage.read();this.state=saved||this.create();if(!this.valid(this.state))throw Error('本地存档不兼容或损坏，原数据已保留');if(!saved)storage.write(copy(this.state));}
 /** 创建可自由合成的初始阵容，和旧录制账号完全隔离。 */
 create(){const r=this.rules,s={version:r.version,seed:r.startingSeed,stage:1,gold:r.startingGold,nextUid:1,units:[],shop:[],battles:0,wins:0,pending:null};s.units=r.startingRoster.map((id,index)=>({uid:s.nextUid++,heroId:id,star:1,slot:r.initialDeployment.find(d=>d.index===index)?.slot??-1}));s.shop=this.roster.slice(0,r.shopSize).map(h=>h.id);return s;}
 /** 根据已胜场数给出人数限制，英雄阶级不会偷偷改变上阵花费。 */
 limit(){if(this.hooks?.limit)return this.hooks.limit();return Math.min(this.rules.maxDeployedLimit,this.rules.baseDeployedLimit+Math.floor(this.state.wins/this.rules.limitEveryWins));}
 /** 按给定快照计算上阵校验上限，允许远征策略扩展等级成长。 */
 validationLimit(s){return Math.min(this.rules.maxDeployedLimit,this.rules.baseDeployedLimit+Math.floor(s.wins/this.rules.limitEveryWins));}
 /** 验证存档中的经济、UID、格子与待领取结果。 */
 valid(s){const r=this.rules;return s.version===r.version&&Number.isInteger(s.stage)&&s.stage>=1&&Number.isInteger(s.gold)&&s.gold>=0&&Number.isInteger(s.seed)&&s.seed>=0&&Number.isInteger(s.nextUid)&&s.nextUid>0&&Number.isInteger(s.battles)&&s.battles>=0&&Number.isInteger(s.wins)&&s.wins>=0&&s.wins<=s.battles&&Array.isArray(s.units)&&s.units.length>0&&require('./reserve-policy').valid(r,s.units.length)&&new Set(s.units.map(u=>u.uid)).size===s.units.length&&s.units.every(u=>this.roster.some(h=>h.id===u.heroId)&&Number.isInteger(u.uid)&&u.uid>0&&u.uid<s.nextUid&&Number.isInteger(u.star)&&u.star>=1&&u.star<=r.maxStar&&Number.isInteger(u.slot)&&u.slot>=-1&&u.slot<r.columns*r.rows)&&new Set(s.units.filter(u=>u.slot>=0).map(u=>u.slot)).size===s.units.filter(u=>u.slot>=0).length&&s.units.filter(u=>u.slot>=0).length<=this.validationLimit(s)&&Array.isArray(s.shop)&&s.shop.length===r.shopSize&&s.shop.every(id=>id===null||this.roster.some(h=>h.id===id))&&(!s.pending||(s.pending.id===s.battles+1&&s.pending.stage===s.stage&&['win','loss','draw'].includes(s.pending.battle?.result)&&Number.isInteger(s.pending.gold)&&s.pending.gold>=0&&Array.isArray(s.pending.choices)&&s.pending.choices.every(id=>this.roster.some(h=>h.id===id))));}
 /** 每次修改要么完整落盘，要么恢复内存；校验失败不会写入存档。 */
 transact(operation){const before=copy(this.state);try{const result=operation();if(!this.valid(this.state))throw Error('操作违反阵容或存档约束');this.storage.write(copy(this.state));return result;}catch(error){this.state=before;throw error;}}
 /** 未领取的战斗结果锁定经济和阵容。 */
 editable(){if(this.state.pending)throw Error('请先领取本场结算');}
 /** 查找目标武将，避免无效 UID 意外修改其他单位。 */
 unit(uid){const unit=this.state.units.find(u=>u.uid===uid);if(!unit)throw Error('请先选择武将');return unit;}
 /** 空位移动、交换以及退回备战席均使用一个原子操作。 */
 deploy(uid,slot){return this.transact(()=>{this.editable();const unit=this.unit(uid);if(!Number.isInteger(slot)||slot< -1||slot>=this.rules.columns*this.rules.rows)throw Error('只能放在己方棋盘');const other=this.state.units.find(u=>u!==unit&&u.slot===slot&&slot>=0);if(unit.slot<0&&slot>=0&&!other&&this.state.units.filter(u=>u.slot>=0).length>=this.limit())throw Error('上阵人数已满，请交换或下阵');if(other)other.slot=unit.slot;unit.slot=slot;});}
 /** 原地或随机三合一，优先保留上阵格子，使用固定种子保证可重现。 */
 merge(uid,mode='same'){return this.transact(()=>{this.editable();if(!['same','random'].includes(mode))throw Error('无效合成方式');const unit=this.unit(uid);if(unit.star>=this.rules.maxStar)throw Error('已达最高阶');const group=this.state.units.filter(u=>u.heroId===unit.heroId&&u.star===unit.star).sort((a,b)=>(b.uid===uid)-(a.uid===uid));if(group.length<this.rules.mergeCount)throw Error('需要三名相同武将、相同阶级');const consumed=group.slice(0,this.rules.mergeCount);if(unit.slot<0)unit.slot=consumed.find(u=>u.slot>=0)?.slot??-1;unit.star++;if(mode==='random'){const pool=this.availableRoster().filter(h=>h.id!==unit.heroId),rng=random(this.state.seed++);unit.heroId=pool[Math.floor(rng()*pool.length)].id;}this.state.units=this.state.units.filter(u=>u===unit||!consumed.includes(u));return unit.uid;});}
 /** 招募使用已落盘的商店条目，缺货、金币或容量不足时不扣款。 */
 recruit(index){return this.transact(()=>{this.editable();if(!Number.isInteger(index)||index<0||index>=this.state.shop.length)throw Error('无效招募位置');const id=this.state.shop[index];if(!id)throw Error('该武将已招募');if(require('./reserve-policy').full(this.rules,this.state.units.length))throw Error('备战容量已满，请合成或遣返');if(this.state.gold<this.rules.recruitCost)throw Error('军资不足');this.state.gold-=this.rules.recruitCost;const unit={uid:this.state.nextUid++,heroId:id,star:1,slot:-1};this.state.units.push(unit);this.state.shop[index]=null;return unit.uid;});}
 /** 按固定种子更新招募列表；刷新与领奖共用此配置规则。 */
 roll(){const rng=random(this.state.seed++),pool=this.availableRoster();this.state.shop=Array.from({length:this.rules.shopSize},()=>pool[Math.floor(rng()*pool.length)].id);}
 /** 可获取棋子由进度端口筛选，敌人显示不受玩家解锁限制。 */
 availableRoster(){return this.hooks?.pool?this.hooks.pool():this.roster;}
 /** 刷新招募只扣一次配置指定的军资。 */
 refresh(){return this.transact(()=>{this.editable();if(this.state.gold<this.rules.refreshCost)throw Error('军资不足');this.state.gold-=this.rules.refreshCost;this.roll();});}
 /** 遣返保留最后一名武将，返还费用小于原招募与合成投入。 */
 sell(uid){return this.transact(()=>{this.editable();const unit=this.unit(uid);if(this.state.units.length===1)throw Error('至少保留一名武将');this.state.gold+=Math.floor(this.rules.recruitCost*this.rules.sellRatio*Math.pow(this.rules.mergeCount,unit.star-1));this.state.units=this.state.units.filter(u=>u.uid!==uid);});}
 /** 每关敌阵固定，退出重进不能刷新更弱的对手。 */
 enemies(){if(this.hooks?.enemies){const enemies=this.hooks.enemies();if(enemies)return enemies;}const r=this.rules,rng=random(this.state.stage*997),count=Math.min(r.maxDeployedLimit,r.enemyStartCount+Math.floor((this.state.stage-1)/r.enemyEveryStages));return Array.from({length:count},(_,i)=>({uid:-i-1,heroId:this.roster[Math.floor(rng()*this.roster.length)].id,star:1,slot:r.enemyColumns[i%r.enemyColumns.length]}));}
 /** 先生成并保存完整结果，再允许画面播放；演武不产生推进或经济奖励。 */
 fight(training=false){return this.transact(()=>{this.editable();const lordSkill=this.hooks?.beforeFight?.(training);const allies=this.state.units.filter(u=>u.slot>=0);if(!allies.length)throw Error('请至少上阵一名武将');const r=this.rules,scale=require("./chapter-difficulty").scale(this.state,r),battle=(this.simulator||simulate)(allies,this.enemies(),this.roster,r,this.state.seed++,scale),rng=random(this.state.seed++);this.state.pending={...(lordSkill?{lordSkill}:{}),id:this.state.battles+1,stage:this.state.stage,training:!!training,battle,gold:training?0:battle.result==='win'?r.winGold:r.lossGold,choices:!training&&battle.result==='win'?Array.from({length:r.rewardChoices},()=>{const pool=this.availableRoster();return pool[Math.floor(rng()*pool.length)].id;}):[]};return copy(battle);});}
 /** 一次性选将与结算；容量已满时允许显式放弃选将领取军资。 */
 claim(index=null){if(!this.state.pending)return false;return this.transact(()=>{const p=this.state.pending;if(index!==null){if(!Number.isInteger(index)||index<0||index>=p.choices.length)throw Error('无效奖励选择');if(require('./reserve-policy').full(this.rules,this.state.units.length))throw Error('容量已满，可只领取军资');this.state.units.push({uid:this.state.nextUid++,heroId:p.choices[index],star:1,slot:-1});}this.hooks?.settle?.(p);this.state.gold+=p.gold;this.state.battles++;if(!p.training&&p.battle.result==='win'){this.state.stage++;this.state.wins++;}this.state.pending=null;if(!p.training)this.roll();return true;});}
}
module.exports={Campaign};
