'use strict';
const entries=require('./equipment-catalog-data'),quality=require('./equipment-catalog-config').quality,theme=require('./equipment-theme'),icon=require('./equipment-icon');
/** 只读取装备展示元数据，不查询进阶资格、不抽奖、不修改存档。 */
function describe(id){const entry=entries.find(e=>e.id===id);if(!entry)throw Error('未知装备：'+id);return {id,name:theme[id]?.name||entry.name,quality:quality[entry.quality]};}
/** 组合共用品质边框、名称和可选品质标签，返回动画及交互需要的节点。 */
function draw(ui,parent,id,layout,nodeName='equipment-reward'){
 const data=describe(id),p=layout.icon,item=icon.draw(ui,parent,{id},p.x,p.y,p.size,nodeName);
 const title=layout.name?label(ui,parent,data.name,data.quality.color,layout.name):null;
 const badge=layout.quality?label(ui,item,data.quality.name,data.quality.color,layout.quality):null;
 return {item,title,badge,data};
}
/** 所有标题使用调用场景配置的位置尺寸，颜色始终取共用品质定义。 */
function label(ui,parent,text,color,layout){return ui.text(parent,text,layout.x??0,layout.y,layout.font,color,layout.width,layout.height);}
module.exports={describe,draw};
