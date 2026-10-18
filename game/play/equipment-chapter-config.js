'use strict';
/** 兼容旧查询：仅列原版首次章节条件，不再为后续阶级追加章节门槛。实际判定在equipment-unlock。 */
module.exports=Object.fromEntries(require('./equipment-catalog-data').map(e=>[e.id,require('./equipment-upgrade-config').entries[e.id].map(()=>e.unlock.kind===1?e.unlock.value:0)]));
