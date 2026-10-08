'use strict';
const equipment=require('./expedition-config').equipment,c=require('./merchant-offer-config');
/** 只读生成商品信息，预览不扣款、不发货、不改动候选。 */
function query(model,index){
 const e=model.nodeEvents.state,o=e?.offers[index];
 if(!e||e.kind!=='merchant'||e.done||e.bought.includes(index)||!o||o.kind==='adGold')throw Error('商品不可购买');
 const result={eventKey:e.key,index,price:o.price};
 if(o.kind==='equipment'){const item=equipment.find(v=>v.id===o.id);return {...result,title:item.name,image:'equipment/'+o.id+'.png',description:item.description};}
 if(o.kind==='hero'){const hero=model.roster.find(v=>v.id===o.id),t=hero.tiers?.find(v=>v.star===o.star)||hero;return {...result,title:hero.name+' · '+o.star+'阶',image:o.id+'-avatar.png',description:[hero.faction+' / '+hero.role,'生命 '+t.hp+'    攻击 '+t.attack,'物防 '+t.armor+'    魔防 '+(t.magicArmor||0)+'    射程 '+t.range,...(t.skills||[]).map(s=>s.name+'：'+s.description)].join('\n')};}
 return {...result,title:c.experienceName,image:null,description:c.experienceDescription.replace('{amount}',o.amount)};
}
module.exports={query};
