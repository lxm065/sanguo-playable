'use strict';
const c=require('./challenge-config').equipmentBar;
/** 装备栏只显示闲置图标，支持翻页与原有拖动，空白区域不打开背包。 */
function render(v,parent,items){const idle=items.filter(e=>e.owner===null),pages=Math.max(1,Math.ceil(idle.length/c.columns)),page=Math.min(v.equipmentPage||0,pages-1);v.equipmentPage=page;idle.slice(page*c.columns,(page+1)*c.columns).forEach((item,i)=>{const n=require('./equipment-icon').draw(v.ui,parent,item,(i-(c.columns-1)/2)*c.gap,0,c.size);v.bindEquipment(n,item);});v.equipmentPager={pages,refresh:()=>{for(const n of [...parent.children]){n.removeFromParent();n.destroy();}render(v,parent,v.service.state.run.players[0].equipment);}};if(!parent.equipmentSwipeBound){parent.equipmentSwipeBound=true;require('./equipment-swipe').bind(v,parent,e=>{const p=e.getUILocation();return v.root.getComponent(v.cc.UITransform).convertToNodeSpaceAR(new v.cc.Vec3(p.x,p.y,0));});}}
module.exports={render};
