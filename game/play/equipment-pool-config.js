'use strict';
/** 全部已实装装备按图鉴品质进入一致的掉落池。 */
const rows=require('./equipment-catalog-data'),ids=(category,quality)=>rows.filter(e=>(!category||e.category===category)&&e.quality===quality).map(e=>e.id);module.exports={physical:ids('physical',2),magic:ids('magic',2),support:ids('support',2),blue:ids(null,2),purple:ids(null,3)};
