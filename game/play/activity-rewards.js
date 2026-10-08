"use strict";
const {random}=require('./combat'),config=require('./activity-config');
/** 在存档事务中逐片抽取并合并，回执与仓库使用同一份具体结果。 */
function resolve(model,items,multiplier=1){const result={};for(const [id,n]of Object.entries(items)){const count=n*multiplier;if(!['101','102','103'].includes(id)){result[id]=(result[id]||0)+count;continue;}const pool=id==='103'?Object.keys(require('./equipment-theme')):id==='102'?require('./vip-fragment-pool'):config.fragments.pool;if(!pool.length)throw Error('装备碎片奖池未配置');const rng=random(model.state.seed++);for(let i=0;i<count;i++){const item=pool[Math.floor(rng()*pool.length)];result[item]=(result[item]||0)+1;}}return result;}
/** 具体奖励只在调用方事务内部入库，不允许展示层再次随机。 */
function grant(model,items,multiplier=1,vipBonus=true){const result=resolve(model,items,multiplier);for(const [id,n]of Object.entries(result))result[id]=model.progression.add(id,n,vipBonus);return result;}
/** 旧版问号碎片按现有数量一次核销；事务失败时随机种子与库存共同回滚。 */
function settleLegacy(model){const id=config.fragments.randomItem,count=model.state.meta.inventory[id]||0;if(!count)return;return model.transact(()=>{const items=grant(model,{[id]:count});model.state.meta.inventory[id]=0;return items;});}
module.exports={resolve,grant,settleLegacy};
