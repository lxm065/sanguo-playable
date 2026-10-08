'use strict';
const c=require('./node-event-config'),policy=require('./expedition-config'),{random}=require('./combat');
/** 地图事件领域服务：候选落盘、消费、领奖和推进共用战役事务。 */
class NodeEvents{
 /** 注入战役模型，禁止视图自行发奖或修改路线。 */
 constructor(model){this.model=model;}
 /** 返回当前小节事件快照，已完成事件保留到玩家点击前进。 */
 get state(){return this.model.state.meta?.nodeEvent;}
 /** 首次进入生成候选并保存；退出重进不会重抽或重复领取。 */
 enter(node){const m=this.model,key=m.state.meta.chapter+'-'+m.state.meta.section+'-'+node.id;if(this.state?.key===key)return;const rng=random(m.state.seed++),pick=pool=>pool[Math.floor(rng()*pool.length)];const e={key,node:node.id,kind:node.type,done:false,bought:[],adClaimed:false,offers:[],choices:[]};if(node.type==='merchant'){e.offers=c.merchant.heroRanks.map(star=>({kind:'hero',id:require("./talent-economy").pick(m,m.pool(star),rng).id,star,price:c.merchant.heroPrices[star]}));for(let i=0;i<c.merchant.blueCount;i++)e.offers.push({kind:'equipment',id:pick(c.merchant.bluePool),price:c.merchant.bluePrice});e.offers.push({kind:'experience',amount:c.merchant.experience,price:c.merchant.experiencePrice});for(let i=0;i<c.merchant.purpleCount;i++)e.offers.push({kind:'equipment',id:pick(c.merchant.purplePool),price:c.merchant.purplePrice});e.offers.push({kind:'adGold',amount:require('./vip').perks(m).data_4});}else if(node.type==='treasure'){const pool=[...c.treasure.pool];for(let i=0;i<c.treasure.count;i++){const id=pick(pool);e.choices.push(id);for(let j=pool.length-1;j>=0;j--)if(pool[j]===id)pool.splice(j,1);}}else e.equipment=pick(c.spring.pool);m.state.meta.nodeEvent=e;}
 /** 拒绝战斗中、过期事件及已领取页面的重复操作。 */
 require(kind){this.model.editable();const e=this.state;if(!e||e.kind!==kind||e.done||this.model.state.meta.activeNode!==e.node)throw Error('事件已结束');return e;}
 /** 唯一单位实例创建，复制不克隆装备或上阵位置。 */
 addUnit(id,star){const m=this.model;if(require('./reserve-policy').full(m.rules,m.state.units.length))throw Error('备战席已满，请先腾出位置');const u={uid:m.state.nextUid++,heroId:id,star,slot:-1};m.state.units.push(u);return u;}
 /** 商店经验使用与战斗结算一致的主公升级阈值。 */
 gainExperience(amount){const e=this.model.state.expedition;e.experience+=amount;while(e.level<=policy.experience.thresholds.length&&e.experience>=policy.experience.thresholds[e.level-1]){e.experience-=policy.experience.thresholds[e.level-1];e.level++;}}
 /** 商店购买一次扣款发货；失败后由外层事务完整回滚。 */
 buy(index,eventKey=this.state?.key){return this.model.transact(()=>{const e=this.require('merchant');if(e.key!==eventKey)throw Error('商店已变化，请重新选择商品');const o=e.offers[index],m=this.model;if(!o||o.kind==='adGold'||e.bought.includes(index))throw Error('商品不可购买');if(m.state.gold<o.price)throw Error('金币不足');if(o.kind==='hero'){if(!m.pool(o.star).some(h=>h.id===o.id))throw Error('武将尚未解锁');this.addUnit(o.id,o.star);}else if(o.kind==='equipment')m.addEquipment(o.id);else this.gainExperience(o.amount);m.state.gold-=o.price;e.bought.push(index);});}
 /** 广告快照额外绑定事件，旧页面回调不能在下一节点领奖。 */
 ticket(){return {...this.model.adTicket(),eventKey:this.state?.key};}
 /** 完整观看回调才消费凭据，同一事件不能重复发放广告奖励。 */
 consume(ticket){if(ticket?.eventKey!==this.state?.key)throw Error('广告页面已变化');this.model.consumeAd(ticket);}
 /** 商店视频赠送金币一次；失败或取消不调用本入口。 */
 claimGold(ticket){return this.model.transact(()=>{const e=this.require('merchant');if(e.adClaimed)throw Error('金币已领取');this.consume(ticket);this.model.state.gold+=require('./vip').perks(this.model).data_4;e.adClaimed=true;});}
 /** 完成事件后推进一次，保留结果供当前页展示。 */
 finish(){const e=this.state,node=this.model.progression.nodes().find(n=>n.id===e.node);if(!node)throw Error('事件节点不存在');e.done=true;this.model.progression.advance(node);}
 /** 完成开箱展示后只保存显示状态，不发奖、不重新抽取。 */
 revealTreasure(key){return this.model.transact(()=>{const e=this.require('treasure');if(e.key!==key)throw Error('宝藏页面已变化');e.revealed=true;});}
 /** 宝藏三选一或完整看视频全领，候选不会在重载时刷新。 */
 treasure(index,ticket=null){return this.model.transact(()=>{const e=this.require('treasure');if(ticket){this.consume(ticket);e.choices.forEach(id=>this.model.addEquipment(id));}else{if(!Number.isInteger(index)||!e.choices[index])throw Error('请选择宝藏');this.model.addEquipment(e.choices[index]);}this.finish();});}
 /** 泉水仅选择效果，目标从符合阶级的己方单位中随机抽取，种子和奖励同事务落盘。 */
 spring(kind){return this.model.transact(()=>{const e=this.require('spring'),m=this.model;if(kind==='equipment')m.addEquipment(e.equipment);else{if(!['copy','upgrade'].includes(kind))throw Error('未知泉水效果');const limit=kind==='copy'?c.spring.copyMax:Math.min(c.spring.upgradeMax,m.maxRank()-1),pool=m.state.units.filter(u=>u.star<=limit);if(!pool.length)throw Error('没有符合阶级的武将');const u=pool[Math.floor(random(m.state.seed++)()*pool.length)];e.result={kind,heroId:u.heroId,star:kind==='upgrade'?u.star+1:u.star,uid:u.uid};if(kind==='copy')this.addUnit(u.heroId,u.star);else{u.star++;if(u.star===require('./war-order-config').star)m.activities.record('merge4');}}this.finish();});}
 /** 商人离开即推进，宝藏与泉水必须先完成选择。 */
 leave(){return this.model.transact(()=>{this.require('merchant');this.finish();});}
 /** 出售价格集中配置；已装备物品需先卸下，武将装备退回背包。 */
 sell(kind,uid){return this.model.transact(()=>{this.require('merchant');const m=this.model;if(kind==='hero')return m.sell(uid);const list=m.state.expedition.equipment,index=list.findIndex(e=>e.uid===uid);if(index<0||list[index].owner!==null)throw Error('请先卸下装备');const item=list[index],purple=c.merchant.purplePool.includes(item.id);m.state.gold+=Math.floor((purple?c.merchant.purplePrice:c.merchant.bluePrice)*c.merchant.sellRatio);list.splice(index,1);});}
}
module.exports={NodeEvents};
