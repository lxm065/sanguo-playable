'use strict';
const {query}=require('./merchant-offer-query'),c=require('./merchant-offer-config'),{wrapDescription}=require('./unit-details');
/** 展示商品说明，只有明确点击价格按钮才触发原有购买事务。 */
function show(view,index){
 let offer;try{offer=query(view.model,index);}catch(error){view.notice(c.errorTitle,error.message);return;}
 return render(view,offer,view.overlay(),true);
}
/** 在奖励弹窗之上打开只读详情，关闭仅移除详情层，保留待领取奖励。 */
function preview(view,id,parent){const shade=view.ui.box(parent,'reward-equipment-detail',0,0,view.config.layout.width,view.config.layout.height,'#15120FDD',false);shade.addComponent(view.cc.BlockInputEvents);return render(view,require('./merchant-offer-query').equipmentPreview(view.model,id),shade,false);}
/** 商店购买与奖励预览共用布局和滚动正文，只有商店模式提供购买按钮。 */
function render(view,offer,shade,purchase){
 const u=view.ui,width=c.width-c.padding*2,lines=wrapDescription(offer.detailText||offer.description,width,c.font),bodyHeight=lines.length*c.lineHeight,height=Math.min(c.maxHeight,Math.max(c.minHeight,c.bodyInset+bodyHeight+c.buttonInset*2)),top=height/2,card=offer.qualityStyle?require('./equipment-paper').create(view,shade,'merchant-offer-detail',0,0,c.width,height):view.paper(shade,'merchant-offer-detail',0,0,c.width,height);
 card.addComponent(view.cc.BlockInputEvents);
 u.text(card,offer.title,0,top-c.titleInset,36,offer.qualityStyle?.color||c.titleColor,width,52);
 if(offer.qualityStyle)u.box(card,'equipment-quality',0,top-c.iconInset,c.iconSize+6,c.iconSize+6,offer.qualityStyle.color,false);
 if(offer.image)u.image(card,offer.image,0,top-c.iconInset,c.iconSize,c.iconSize);else u.text(card,'EXP',0,top-c.iconInset,40,c.titleColor,width,70);
 const viewportHeight=Math.min(bodyHeight,height-c.bodyInset-c.bodyBottomInset),max=Math.max(0,bodyHeight-viewportHeight);
 const viewport=u.node(card,'merchant-detail-scroll',0,top-c.bodyInset-viewportHeight/2,width,viewportHeight);viewport.addComponent(view.cc.Mask);
 const content=u.node(viewport,'merchant-detail-content',0,0,width,bodyHeight);
 // 按行生成标签，避免长正文单张字体纹理超过设备尺寸上限。
 lines.forEach((line,index)=>{const label=u.text(content,line,0,viewportHeight/2-(index+.5)*c.lineHeight,c.font,c.bodyColor,width,c.lineHeight);label.horizontalAlign=view.cc.Label.HorizontalAlign.LEFT;label.enableWrapText=false;label.lineHeight=c.lineHeight;});
 require('./scroll-gesture').bindScroll(view.cc,viewport,content,{min:0,max,threshold:c.dragThreshold,onOffset(){},onDrag(){}});
 if(max)u.text(card,c.scrollHint,0,top-c.bodyInset-viewportHeight-c.scrollHintGap,c.scrollHintFont,c.bodyColor,width,c.lineHeight);
 if(purchase)u.button(card,c.pricePrefix+offer.price,0,-top+c.buttonInset,c.buttonWidth,()=>view.act(()=>view.model.nodeEvents.buy(offer.index,offer.eventKey)));
 u.text(shade,c.close,0,-top-c.closeGap,26,'#F8ECD7',c.width,40);
 shade.on(view.cc.Node.EventType.TOUCH_END,event=>{event.propagationStopped=true;if(event.target===shade){shade.destroy();if(view.modal===shade)view.modal=null;}});
}
module.exports={show,preview};
