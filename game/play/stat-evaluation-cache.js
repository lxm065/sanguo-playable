'use strict';
const contexts=new WeakMap();
/** 一次静态阵容搜索内复用不变的羁绊、装备定义，搜索结束后可被回收。 */
function create(rules){const local={...rules};contexts.set(local,{teams:new WeakMap(),equipment:new Map()});return local;}
/** 仅搜索专用规则具有缓存，正式战斗属性仍按原逻辑计算。 */
function get(rules){return contexts.get(rules);}
module.exports={create,get};
