'use strict';
const equipment=require('./expedition-config').equipment,c=require('./merchant-offer-config');
/** 只读生成商品信息，预览不扣款、不发货、不改动候选。 */
function query(model,index){
 const e=model.nodeEvents.state,o=e?.offers[index];
 if(!e||e.kind!=='merchant'||e.done||e.bought.includes(index)||!o||o.kind==='adGold')throw Error('商品不可购买');
 const result={eventKey:e.key,index,price:o.price};
 if(o.kind==='equipment')return {...result,...equipmentPreview(model,o.id)};
 if(o.kind==='hero'){const hero=model.roster.find(v=>v.id===o.id),t=hero.tiers?.find(v=>v.star===o.star)||hero;return {...result,title:hero.name+' · '+o.star+'阶',image:o.id+'-avatar.png',description:[hero.faction+' / '+hero.role,'生命 '+t.hp+'    攻击 '+t.attack,'物防 '+t.armor+'    魔防 '+(t.magicArmor||0)+'    射程 '+t.range,...(t.skills||[]).map(s=>s.name+'：'+s.description)].join('\n')};}
 return {...result,title:c.experienceName,image:null,description:c.experienceDescription.replace('{amount}',o.amount)};
}
/** 奖励预览与商店读取同一份装备属性，不需要生成商品或购买状态。 */
function equipmentPreview(model,id){const item=equipment.find(v=>v.id===id),detail=require('./equipment-catalog').query(id,model.state);if(!item)throw Error('装备不存在');return {title:item.name,qualityStyle:detail.qualityStyle,image:'equipment/'+id+'.png',description:item.description,detailText:[...detail.effects,detail.lore.label+' · '+detail.lore.title,detail.lore.text].join('\n\n')};}
module.exports={query,equipmentPreview};
