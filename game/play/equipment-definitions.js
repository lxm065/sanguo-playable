'use strict';
/** 普通装备和主公特殊装备共用定义查询；特殊装备不因此加入普通掉落与进阶池。 */
function get(id){const normal=require('./expedition-config').equipment.find(e=>e.id===id);if(normal)return normal;const c=require('./sunjian-skill-config');return id===c.id?{id:c.id,name:c.name,symbol:'福',description:c.description,basic:c.basic}:undefined;}
module.exports={get};
