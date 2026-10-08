'use strict';
const {query}=require('./merchant-offer-query'),c=require('./merchant-offer-config'),{wrapDescription}=require('./unit-details');
/** 展示商品说明，只有明确点击价格按钮才触发原有购买事务。 */
function show(view,index){
 let offer;try{offer=query(view.model,index);}catch(error){view.notice(c.errorTitle,error.message);return;}
 const u=view.ui,shade=view.overlay(),width=c.width-c.padding*2,lines=wrapDescription(offer.description,width,c.font),bodyHeight=lines.length*c.lineHeight,height=Math.min(c.maxHeight,Math.max(c.minHeight,c.bodyInset+bodyHeight+c.buttonInset*2)),top=height/2,card=view.paper(shade,'merchant-offer-detail',0,0,c.width,height);
 card.addComponent(view.cc.BlockInputEvents);
 u.text(card,offer.title,0,top-c.titleInset,36,c.titleColor,width,52);
 if(offer.image)u.image(card,offer.image,0,top-c.iconInset,c.iconSize,c.iconSize);else u.text(card,'EXP',0,top-c.iconInset,40,c.titleColor,width,70);
 u.text(card,lines.join('\n'),0,top-c.bodyInset-bodyHeight/2,c.font,c.bodyColor,width,bodyHeight);
 u.button(card,c.pricePrefix+offer.price,0,-top+c.buttonInset,c.buttonWidth,()=>view.act(()=>view.model.nodeEvents.buy(offer.index,offer.eventKey)));
 u.text(shade,c.close,0,-top-c.closeGap,26,'#F8ECD7',c.width,40);
 shade.on(view.cc.Node.EventType.TOUCH_END,event=>{event.propagationStopped=true;if(event.target===shade){shade.destroy();view.modal=null;}});
}
module.exports={show};
