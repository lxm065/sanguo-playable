'use strict';
const c=require('./sunjian-skill-config');
/** 每局只发一次开局装备；旧档无待结算战报时补发，卖出后不会自动补领。 */
function initialize(model){const s=model.state,e=s.expedition;if(s.meta?.lord!==c.lord||!e||s.pending||e.sunjian)return null;const existing=e.equipment.find(x=>x.id===c.id),uid=existing?.uid??model.addEquipment(c.id);e.sunjian={uid,shown:false};return uid;}
/** 换主公清除开局赐福，防止切换重复领取或将开局奖励带给其他主公。 */
function changeLord(model,next){if(model.state.meta.lord===next)return;const e=model.state.expedition;if(!e)return;e.equipment=e.equipment.filter(x=>x.id!==c.id);delete e.sunjian;}
/** 只有特殊装备使用实例层数；普通装备继续读取原有永久进阶规则。 */
function resolve(definition,item){if(item.id!==c.id)return definition;const basic={...c.basic};for(const [key,value]of Object.entries(c.growth))basic[key]+=value*(item.stacks||0);return {...definition,basic};}
/** 成长随战报固定，按技能79999采用穿戴者存活；背包、备战席和败局不成长。 */
function receipt(units,result){if(result!=='win')return [];return units.filter(u=>u.side==='ally'&&u.hp>0&&!u.summoned).flatMap(u=>(u.equipmentRuntime||[]).filter(e=>e.id===c.id).map(e=>({uid:e.uid,stacks:(e.stacks||0)+1})));}
/** 特殊装备保持局内成长，不进入碎片进阶或普通掉落池。 */
function describe(item={}){const data=resolve({},item.id?item:{...item,id:c.id}),stacks=item.stacks||0;return {id:c.id,name:c.name,quality:5,qualityStyle:c.quality,special:true,active:true,revealed:true,grade:0,max:true,cost:null,canUpgrade:false,reason:'随存活通关成长',attributes:c.fields.map(([key,label])=>label+'+'+data.basic[key]),effects:[c.description,'当前赐福层数：'+stacks],upgrades:[],lore:{label:'主公赐福',title:c.sourceName,text:'孙坚开局赐予的装备，成长随本次远征保留，重新开始章节后重置。'}};}
/** 首次进入备战只消费展示标志，奖励已经在同一存档事务中到账。 */
function show(view){const m=view.model,e=m.state.expedition.sunjian;if(m.state.meta.lord!==c.lord||!e||e.shown||view.playing||m.state.pending)return;m.transact(()=>{m.state.expedition.sunjian.shown=true;});require('./lord-skill-view').show(view,()=>{},{lord:c.lord,kind:'equipment',id:c.id});}
module.exports={initialize,changeLord,resolve,receipt,describe,show};
