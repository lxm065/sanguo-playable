'use strict';
const contexts=new WeakMap();
/** 在一次阵容搜索或单侧属性快照内复用羁绊和装备定义，完成后可被回收。 */
function create(rules){const local={...rules};contexts.set(local,{teams:new WeakMap(),equipment:new Map()});return local;}
/** 仅显式创建的计算上下文具有缓存，不跨事务保存动态战斗属性。 */
function get(rules){return contexts.get(rules);}
module.exports={create,get};
