'use strict';
const service=require('./bond-activation'),config=require('./bond-activation-config');
/** 绘制未激活卡片，广告结算后用原图鉴状态恢复羁绊页。 */
function render(book,content,y,entry){
 const {host:view,ui,layout}=book, l=config.layout;
 const {id,chapter,name}=entry, hero=book.book.hero(entry.hero);
 const card=ui.box(content,'activate-bond-'+id,0,y-l.height/2,layout.viewportWidth-8,l.height-12,layout.paper);
 book.face(card,hero,l.portraitX,-8,l.portraitSize);
 ui.text(card,hero.name,l.portraitX,-76,l.font,layout.ink,130,36);
 ui.text(card,'通关第'+chapter+'章\n解锁：'+hero.name+'\n激活：'+name,l.textX,0,l.font,layout.ink,230,145);
 if(!service.ready(view.model,id)){
  require('./lock-view').show(book,card,l.buttonX,0);
  return;
 }
 const ticket=view.model.adTicket();
 ui.button(card,'▶ 激活'+name,l.buttonX,0,l.buttonWidth,()=>{
  if(book.dragged)return;
  const page=view.page;
  return view.ad(()=>service.activate(view.model,id,ticket),()=>{
   // 旧弹窗移出画布后仍可能在当帧有效，以宿主当前弹窗引用为准。
   if(view.page===page&&view.handbook===book&&!view.modal)book.open();
  });
 },'#BA851C',82);
 require('./notification-view').badge(view,card,'bond-'+id,l.buttonX+l.buttonWidth/2-8,40,()=>service.ready(view.model,id)&&!service.state(view.model).includes(id));
}
module.exports={render};
