'use strict';
const entries=require('./equipment-catalog-data'),quality=require('./equipment-catalog-config').quality,c=require('./equipment-icon-config');
/** 从共用品质表读取边框颜色，兼容未知历史装备。 */
function color(id){return quality[entries.find(e=>e.id===id)?.quality]?.color||c.fallback;}
/** 将品质底框与内缩图标组合为同一拖动节点，不扩大原有命中尺寸。 */
function draw(ui,parent,item,x,y,size,name='equipment-'+item.uid){const n=ui.box(parent,name,x,y,size,size,color(item.id),false);ui.image(n,'equipment/'+item.id+'.png',0,0,size-c.border*2,size-c.border*2);return n;}
module.exports={color,draw};
