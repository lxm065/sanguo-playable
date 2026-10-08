'use strict';
const data=require('./talent-tree-data'),config=require('./talent-tree-config');
/** 读取旧档时返回零级视图，查询不会修改或写入存档。 */
function state(model){return model.state.meta.activities.talent.tree||{levels:{},spentDiamonds:0,adClaimed:0,adProgress:0,serial:0};}
/** 校验所有存储字段，拒绝未知节点、越界等级和负数成本。 */
function valid(value){return value===undefined||!!value&&!!value.levels&&typeof value.levels==='object'&&!Array.isArray(value.levels)&&Object.entries(value.levels).every(([id,n])=>data[id]&&Number.isInteger(n)&&n>=0&&n<=data[id].max_lv)&&['spentDiamonds','adClaimed','adProgress','serial'].every(k=>Number.isInteger(value[k])&&value[k]>=0)&&value.adProgress<config.adsPerPoint;}
/** 获取当前等级的原表数值，百分比按万分比换算。 */
function value(levels,id){const e=data[id],rank=levels?.[id]||0;return rank&&e?e['skill_data'+rank]/(e.percent?10000:1):0;}
/** 展示原文完整说明，不把非线性升级值改成固定增量。 */
function description(id,rank){const e=data[id],raw=rank?e['skill_data'+rank]:0;return e.des1.replace('{0}',e.percent?(raw/100)+'%':raw);}
/** 节点条件与升级入口共用查询结果，所有前置必须满级。 */
function query(model,id){const e=data[id];if(!e)throw Error('天赋不存在');const t=model.state.meta.activities.talent,s=state(model),rank=s.levels[id]||0,parents=config.prerequisites[e.index].map(i=>String((e.page+1)*1000+i+1)),locked=parents.some(p=>(s.levels[p]||0)<data[p].max_lv),max=rank>=e.max_lv;const reason=t.level<config.unlockLevel?'天赋等级1级解锁':model.state.pending?'请先领取战果':max?'已达满级':locked?'前置天赋须满级':t.points<e.need_num?'天赋点不足':model.state.meta.diamonds<e.need_money?'钻石不足':'';return {...e,rank,parents,locked,max,reason,canUpgrade:!reason};}
/** 列出当前系的17个节点，不触碰随机种子和存档。 */
function nodes(model,page){return Object.keys(data).filter(id=>data[id].page===page).map(id=>query(model,id));}
/** 只在成功事务内部创建新存档字段。 */
function writable(model){const t=model.state.meta.activities.talent;if(!t.tree)t.tree={levels:{},spentDiamonds:0,adClaimed:0,adProgress:0,serial:0};return t.tree;}
/** 扣费、升级与实际钻石账本一次提交，过期双击不重复扣除。 */
function upgrade(model,id,expected){return model.transact(()=>{model.editable();const q=query(model,id);if(q.rank!==expected)throw Error('等级已变化，请重新查看');if(!q.canUpgrade)throw Error(q.reason);const t=model.state.meta.activities.talent,s=writable(model);t.points-=q.need_num;model.state.meta.diamonds-=q.need_money;s.spentDiamonds+=q.need_money;s.levels[id]=q.rank+1;s.serial++;});}
/** 广告凭据与天赋树版本绑定；升级和重置后旧回调无效。 */
function ticket(model){return {serial:state(model).serial};}
/** 领取额度沿用突破等级，保留历史直接获得的点数，不回溯重复发放。 */
function remaining(model){return Math.max(0,model.state.meta.activities.talent.level*config.claimsPerLevel-state(model).adClaimed);}
/** 完整广告回调累计两次获得一点，失败、重复和过期回调均不发奖。 */
function claim(model,token){return model.transact(()=>{model.editable();const t=model.state.meta.activities.talent;if(t.level<config.unlockLevel||!remaining(model))throw Error('暂无可领取天赋点');const s=writable(model);if(token?.serial!==s.serial)throw Error('奖励状态已变化');s.serial++;s.adProgress++;if(s.adProgress>=config.adsPerPoint){s.adProgress=0;s.adClaimed++;t.points++;}});}
/** 重置只返还实际已花的钻石和点数；不恢复广告次数。 */
function reset(model,token){return model.transact(()=>{model.editable();const s=writable(model);if(token?.serial!==s.serial)throw Error('天赋状态已变化');const points=Object.entries(s.levels).reduce((n,[id,rank])=>n+rank*data[id].need_num,0);if(!points)throw Error('没有可重置的天赋');model.state.meta.activities.talent.points+=points;model.state.meta.diamonds+=s.spentDiamonds;s.levels={};s.spentDiamonds=0;s.serial++;});}
module.exports={state,valid,value,description,query,nodes,upgrade,ticket,remaining,claim,reset};
