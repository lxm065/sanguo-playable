'use strict';
const config=require('./route-config'),equipment=require('./expedition-config').equipment;
/** 地图商人使用现有装备与金币，购买和离开均交给进度事务。 */
function showMerchant(view){
 const u=view.ui,overlay=view.overlay(),m=view.paper(overlay,'merchant',0,0,610,630);
 const status=u.text(m,'金币 '+view.model.state.gold,0,202,24,'#674322',540);
 u.text(m,'神秘商人',0,255,36,'#674322',540);
 config.merchant.offers.forEach((offer,i)=>{const item=equipment.find(x=>x.id===offer.id),y=145-i*130,bought=view.progress.state.merchant?.bought.includes(i);u.text(m,item.name+' · '+offer.price+'金币',-75,y,28,'#674322',365);u.button(m,bought?'已购买':'购买',204,y,125,()=>{try{view.progress.buyMerchant(i);view.render();showMerchant(view);}catch(e){status.string=e.message;}},bought?'#655744':'#8E352B');});
 u.button(m,'离开商人',0,-245,300,()=>view.act(()=>view.progress.leaveMerchant()));
}
module.exports={showMerchant};
