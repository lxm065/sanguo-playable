'use strict';
const tree=require('./talent-tree'),effects=require('./talent-effects'),{random}=require('./combat'),pools=require('./equipment-pool-config');
/** 以原主属性天赋增加出现权重，零天赋保持原均匀抽取与随机次数。 */
function pick(model,pool,rng){const levels=model.state.meta?.activities?.talent?.tree?.levels||{},weights=pool.map(h=>1+tree.value(levels,(effects.category(h)+1)*1000+5)),sum=weights.reduce((n,w)=>n+w,0);let value=rng()*sum;for(let i=0;i<pool.length;i++){value-=weights[i];if(value<0)return pool[i];}return pool.at(-1);}
/** 利息只在真实战斗开始事务中增加，失败回滚，演武不产生收益。 */
function beforeFight(model,training){if(training)return;const v=tree.value(model.state.meta?.activities?.talent?.tree?.levels,2017);if(v)model.state.gold+=Math.floor(model.state.gold*v);}
/** 天赋战果在战斗生成时确定并保存，重启、领奖重试均不会重新抽取。 */
function settlePreview(model,p,node){
 if(p.training)return;const levels=model.state.meta?.activities?.talent?.tree?.levels||{};if(!Object.values(levels).some(Boolean))return;
 const v=id=>tree.value(levels,id),rng=random(model.state.seed++),loot=[],choose=pool=>pool[Math.floor(rng()*pool.length)];
 /** 力量来源装备统一经过紫装提升判断。 */
 function equipment(){const pool=v(1017)&&rng()<v(1017)?pools.purple:pools.blue;loot.push({kind:'equipment',id:choose(pool)});}
 /** 智力来源单位保留获取阶级、解锁池及慧根加阶规则。 */
 function hero(rank){if(v(3017)&&rng()<v(3017))rank=Math.min(model.maxRank(),rank+1);const pool=model.pool(rank);if(pool.length)loot.push({kind:'hero',id:pick(model,pool,rng).id,star:rank});}
 for(const e of p.battle.events||[]){if(e.type!=='death'||e.actor<=0||e.uid>=0)continue;const unit=model.state.units.find(u=>u.uid===e.actor);if(!unit)continue;const h=model.roster.find(h=>h.id===unit.heroId),kind=effects.category(h);if(kind===0&&v(1008)&&rng()<v(1008))equipment();if(kind===1)p.gold+=v(2008);if(kind===2&&v(3008)&&rng()<v(3008))hero(1);}
 if(p.battle.result==='win'){p.gold+=v(2011);p.experience=Math.round(p.experience*(1+v(2014)));if(v(1011)&&rng()<v(1011))equipment();if(v(3011)&&rng()<v(3011))hero(1);if(['elite','boss'].includes(node?.type)&&v(3014)&&rng()<v(3014))hero(node.type==='boss'?3:2);}
 p.talentLoot=loot;
}
/** 空间不足的天赋单位进入同一存档的待入队列，不覆盖或丢弃已有武将。 */
function deliver(model,loot=[]){const e=model.state.expedition,queue=[...(e.talentReserve||[]),...loot];e.talentReserve=[];for(const item of queue){if(item.kind==='equipment')model.addEquipment(item.id);else if(require('./reserve-policy').full(model.rules,model.state.units.length))e.talentReserve.push(item);else model.state.units.push({uid:model.state.nextUid++,heroId:item.id,star:item.star,slot:-1});}}
/** 进入BOSS前按强势天赋生成两个紫装售卖位；进出同一关不重抽。 */
function enter(model,node){if(node.type!=='boss'||!model.state.expedition)return;const meta=model.state.meta,s=model.state.expedition,key=meta.chapter+'-'+meta.section+'-'+node.id;if(s.talentShop?.key===key)return;const chance=tree.value(meta.activities?.talent?.tree?.levels,1014);if(!chance)return;const rng=random(model.state.seed++);s.talentShop={key,node:node.id,offers:[],bought:[]};if(rng()<chance)s.talentShop.offers=Array.from({length:require('./talent-tree-config').shopSlots},()=>pools.purple[Math.floor(rng()*pools.purple.length)]);}
/** 天赋商店购买仍使用本局金币，并校验章节键、节点及售罄状态。 */
function buy(model,index,key){return model.transact(()=>{model.editable();const s=model.state.meta,shop=model.state.expedition.talentShop,c=require('./node-event-config').merchant;if(!shop||key!==shop.key||s.activeNode!==shop.node||key!==s.chapter+'-'+s.section+'-'+s.activeNode||!shop.offers[index]||shop.bought.includes(index))throw Error('商品已售罄或商店已变化');if(model.state.gold<c.purplePrice)throw Error('金币不足');model.state.gold-=c.purplePrice;model.addEquipment(shop.offers[index]);shop.bought.push(index);});}
module.exports={pick,beforeFight,settlePreview,deliver,enter,buy};
