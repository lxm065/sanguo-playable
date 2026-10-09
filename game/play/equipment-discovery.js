'use strict';
const theme=require('./equipment-theme');
/** 从真实持有或进阶事实推导收录，旧档无需改写原有物品。 */
function known(state){return [...new Set([...((state.meta?.cleared||0)>=require('./equipment-access-config').revealCleared?require('./expedition-config').equipment.map(e=>e.id):[]),...(state.meta?.equipmentSeen||[]),...Object.entries(state.meta?.inventory||{}).filter(([id,n])=>theme[id]&&n>0).map(([id])=>id),...Object.entries(state.meta?.equipmentGrades||{}).filter(([,n])=>n>0).map(([id])=>id),...(state.expedition?.equipment||[]).map(e=>e.id)])];}
/** 在发奖事务中保留已收录装备，消耗碎片或重开不重新隐藏。 */
function record(m,before){if(m.state.meta)m.state.meta.equipmentSeen=[...new Set([...before,...known(m.state)])];}
module.exports={known,record};
