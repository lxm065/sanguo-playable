'use strict';
const c=require('./equipment-exclusive-config');
/** 无专属名单的装备保持通用，专属装备只对指定武将激活技能。 */
function active(id,heroId){return !c.items[id]||c.items[id].includes(heroId);}
/** 图鉴与战斗装备说明共享专属规则，避免只修改推荐标签。 */
function description(id,text){const ids=c.items[id];if(!ids||id===require('./chitu-config').id)return text;return ids.map(id=>c.names[id]).join('、')+'专属。'+'其他武将仅获得基础属性。'+'\n'+text;}
module.exports={active,description};
