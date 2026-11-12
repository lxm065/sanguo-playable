'use strict';
const c=require('./liubiao-skill-config'),{random}=require('./combat');
/** 只有当前主公的可操作远征能兑换；战斗与待领奖期均锁定。 */
function available(model){return model.state.meta?.lord===c.lord&&model.state.meta.hp>0&&!model.state.pending;}
/** 兑换只列出真实闲置蓝装，不使用碎片、已穿戴装备或紫装。 */
function candidates(model){return model.state.expedition.equipment.filter(e=>e.owner===null&&c.blue.includes(e.id));}
/** 绑定本局、节点、主公和兑换流水，旧窗口与连续点击不可再次消耗。 */
function ticket(model){const s=model.state,m=s.meta,e=s.expedition;return [m.lord,m.chapter,m.section,m.activeNode,s.battles,e.tutorialRunId,e.liubiaoSerial||0].join(':');}
/** 消耗和发奖共用战役事务；存储或发奖失败会同时回滚装备、随机种子和流水。 */
function exchange(model,uids,expected){return model.transact(()=>{model.editable();if(!available(model))throw Error('请在刘表备战时使用');if(expected!==ticket(model))throw Error('兑换页面已变化，请重新选择');if(!Array.isArray(uids)||uids.length!==c.required||new Set(uids).size!==c.required)throw Error('请选择2件不同的蓝色装备');const valid=new Set(candidates(model).map(e=>e.uid));if(uids.some(uid=>!valid.has(uid)))throw Error('装备已变化，请先卸下并重新选择');if(!c.purple.length)throw Error('暂无可兑换紫色装备');const id=c.purple[Math.floor(random(model.state.seed++)()*c.purple.length)],e=model.state.expedition;e.equipment=e.equipment.filter(item=>!uids.includes(item.uid));const uid=model.addEquipment(id);e.liubiaoSerial=(e.liubiaoSerial||0)+1;return {lord:c.lord,kind:'equipment',id,uid};});}
module.exports={available,candidates,ticket,exchange};
