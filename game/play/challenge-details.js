'use strict';
const {PlayView}=require('./view'),{ExpeditionView}=require('./expedition-view');
/** 仅暴露挑战局内状态和穿戴事务，复用远征详情时不读取远征加成或写入远征装备。 */
function adapter(v){const model={roster:v.service.battleRoster,rules:v.config,enemies:()=>v.replay?.initial?.filter(u=>u.side==='enemy')||[],equip:(uid,owner)=>v.service.equip(uid,owner)};Object.defineProperty(model,'state',{get(){const r=v.service.state.run,p=r.players[0];return {units:p.units,expedition:{equipment:p.equipment},meta:{equipmentGrades:{},inventory:{},diamonds:0},stage:1,pending:r.phase!=='preparation'};}});return {cc:v.cc,ui:v.ui,assets:v.assets,root:v.root,config:v.config,roster:model.roster,model,playing:v.playing,paper:(...args)=>v.host.paper(...args),overlay:()=>PlayView.prototype.overlay.call(v),notice:(title,text)=>v.dialog(title,text),render:()=>v.render(),refreshEquipment:()=>require("./challenge-equipment-refresh").refresh(v),act:fn=>v.act(fn),details:(id,uid)=>unit(v,id,uid),equipmentDetails:item=>equipment(v,item),equipmentPanel:(owner,page=0)=>bag(v,owner,page)};}
/** 传入已按挑战规则算好的属性，避免共用详情再套用远征天赋、VIP或敌人倍率。 */
function unit(v,id,uid){const p=v.service.state.run.players[0],u=p.units.find(u=>u.uid===uid)||v.replay?.initial?.find(u=>u.uid===uid);if(!u)return;const value=(v.playing&&v.replay?.initial?.find(u=>u.uid===uid))||require('./expedition-stats').stats(u,p.units,v.service.battleRoster,p.equipment,v.config);return require('./unit-details').showUnitDetails(adapter(v),id,uid,value);}
/** 与远征共用装备说明及卸下按钮，背包详情为只读属性展示。 */
function equipment(v,item){return require('./equipped-item-details').showEquippedItem(adapter(v),v.root,item,()=>{},item.owner===null);}
/** 与远征共用六格背包及穿戴操作；空装备槽指定目标武将。 */
function bag(v,owner=null,page=0){return ExpeditionView.prototype.equipmentPanel.call(adapter(v),owner,page);}
/** 选棋仅展示入局1级基础属性；已解锁和锁定武将均可预览，不读取棋局或修改棋组。 */
function preview(v,id){const unit={uid:'preview-'+id,heroId:id,star:require('./challenge-config').initialLevel,slot:0},roster=v.service.battleRoster,value=require('./expedition-stats').stats(unit,[unit],roster,[],v.config),page=adapter(v);page.model={roster,state:{units:[unit],expedition:{equipment:[]},pending:true},enemies:()=>[]};page.equipmentPanel=null;return require('./unit-details').showUnitDetails(page,id,unit.uid,value);}
module.exports={adapter,unit,equipment,bag,preview};
