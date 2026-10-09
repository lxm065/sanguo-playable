"use strict";
const policy=require('./expedition-config');
/** 从战斗实际参战名单提取全队装备增益，同类多件合并计数，查询不写存档。 */
function query(state){const owners=new Set(state.units.filter(u=>u.slot>=0).map(u=>u.uid)),rows=new Map();for(const item of state.expedition.equipment){const def=policy.equipment.find(e=>e.id===item.id),e=def&&require('./equipment-upgrades').resolve(def,state.meta?.equipmentGrades||{}),dynamic=require('./equipment-effect-config')[item.id]||{};if(!owners.has(item.owner)||!e||!require('./team-equipment-buffs-config').fields.some(k=>e[k]||dynamic[k]))continue;const row=rows.get(item.id)||{...e,item,count:0};row.count++;rows.set(item.id,row);}return [...rows.values()];}
/** 顶部预留栏显示生效装备，可点开只读详情，不提供战斗中装备变更入口。 */
function render(v){const c=require('./battle-hud-config').buffs,u=v.ui;query(v.model.state).forEach((r,i)=>{const n=u.box(v.root,'team-buff-'+r.id,c.x+i%c.columns*c.gap,c.y-Math.floor(i/c.columns)*c.gap,c.size,c.size,'#376D75');u.image(n,'equipment/'+r.id+'.png',0,0,c.size-6,c.size-6);if(r.count>1)u.text(n,'×'+r.count,17,-21,c.font,'#FFFFFF',45,26);n.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;require('./equipped-item-details').showEquippedItem(v,v.root,r.item,()=>{},true);});});}
module.exports={query,render};
