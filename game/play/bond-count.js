'use strict';
const config=require('./handbook-config');
/** 按配置累计参与羁绊的单位，同名同阶也计数，未知人物不参与。 */
function heroes(units,roster){const ids=units.filter(u=>u.slot==null||u.slot>=0).map(u=>u.heroId),selected=config.countDuplicates?ids:[...new Set(ids)];return selected.map(id=>roster.find(h=>h.id===id)).filter(Boolean);}
module.exports={heroes};
