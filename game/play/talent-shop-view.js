'use strict';
const c=require('./talent-tree-config').shopLayout;
/** 只在当前BOSS准备页显示已经生成的天赋商店。 */
function entry(v){const m=v.model.state.meta,s=v.model.state.expedition.talentShop;if(v.playing||v.model.state.pending||!s?.offers.length||s.key!==m.chapter+'-'+m.section+'-'+m.activeNode)return;v.ui.button(v.root,'天赋商店',c.x,c.y,c.width,()=>show(v),'#8B642E',c.height);}
/** 两个紫装售卖位使用既有装备与价格，购买通过领域事务完成。 */
function show(v){const u=v.ui,s=v.model.state.expedition.talentShop,m=v.overlay(),p=u.box(m,'talent-shop',0,0,c.cardWidth,c.cardHeight,'#E5D2AA');p.addComponent(v.cc.BlockInputEvents);u.text(p,'强势 · 神秘商店',0,173,32,'#593E2C');s.offers.forEach((id,i)=>{const x=(i-.5)*c.offerX*2,item=require('./equipment-theme')[id];u.image(p,'equipment/'+id+'.png',x,58,c.icon,c.icon);u.text(p,item.name,x,-25,c.font,'#593E2C',260,60);u.button(p,s.bought.includes(i)?'已售罄':'金币 '+require('./node-event-config').merchant.purplePrice,x,-111,240,()=>{v.act(()=>require('./talent-economy').buy(v.model,i,s.key));if(v.model.state.expedition.talentShop?.key===s.key)show(v);},'#967236',66);});u.button(p,'关闭',0,-195,170,()=>{m.destroy();v.modal=null;},'#806346',48);}
module.exports={entry,show};
