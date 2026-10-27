'use strict';
const c=require('./buff-icon-row-config');
/** 按固定顺序居中排布仍存活的图标，移除时自动收拢。 */
function layout(a){const entries=Object.entries(a.buffIconRow||{}).filter(([,n])=>n&&n.isValid!==false).sort(([x],[y])=>c.order.indexOf(x)-c.order.indexOf(y));entries.forEach(([,n],i)=>n.setPosition?.((i-(entries.length-1)/2)*c.gap,c.y));}
/** 注册真实图标节点并监听销毁，原生特效到期也能回收布局占位。 */
function attach(v,a,key,node){if(!node)return node;a.buffIconRow=a.buffIconRow||{};a.buffIconRow[key]=node;node.once?.(v.cc?.Node?.EventType?.NODE_DESTROYED||'node-destroyed',()=>{if(a.buffIconRow?.[key]===node){delete a.buffIconRow[key];layout(a);}});layout(a);return node;}
/** 先删除占位再销毁节点，刷新与同帧销毁不会误删新图标。 */
function remove(a,key){if(!a)return;const n=a.buffIconRow?.[key];if(a.buffIconRow)delete a.buffIconRow[key];if(n&&n.isValid!==false)n.destroy();layout(a);}
/** 死亡和离场统一清理全部增益行节点。 */
function clear(a){for(const key of Object.keys(a?.buffIconRow||{}))remove(a,key);}
module.exports={attach,remove,clear,layout};
