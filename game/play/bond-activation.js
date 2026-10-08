'use strict';
const config=require('./bond-activation-config');
/** 旧存档以未激活读取，不在只读查询中写盘。 */
function state(model){return model.state.meta?.activatedBonds||[];}
/** 章节解锁与永久激活分别查询，重开远征不清除已激活羁绊。 */
function ready(model,id){const entry=config.entries.find(e=>e.id===id);return !!entry&&(model.state.meta?.cleared||0)>=entry.chapter;}
/** 广告成功后原子消费凭据；重复、旧回调和未通章不能激活。 */
function activate(model,id,ticket){return model.transact(()=>{if(!ready(model,id))throw Error('请先通关指定章节解锁赵云');if(state(model).includes(id))throw Error('羁绊已经激活');model.consumeAd(ticket);model.state.meta.activatedBonds=[...state(model),id];return true;});}
/** 配置成员优先，普通阵营和职业继续沿用既有名单。 */
function member(bond,hero){return !!hero&&(bond.members?bond.members.includes(hero.id):hero[bond.kind]===bond.value);}
/** 无玩家上下文用于中立模拟；新游龙仍需显式激活，既有职业保持兼容。 */
function enabled(id,active){return !config.entries.some(e=>e.id===id)||(active===undefined?id!=='dragon':active.includes(id));}
module.exports={state,ready,activate,member,enabled};
