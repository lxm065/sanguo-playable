'use strict';
const catalog=require('./equipment-catalog'),config=require('./equipment-catalog-config'),upgrades=require('./equipment-upgrades');
/** 创建品质边框、三国器物图标及阶级角标，支持列表和详情复用。 */
function icon(book,parent,item,x,y,size){
 const u=book.ui,l=config.layout,n=u.box(parent,'equipment-'+item.id,x,y,size+6,size+6,item.qualityStyle.color,false);
 u.image(n,item.revealed?'equipment/'+item.id+'.png':config.concealed.icon,0,0,size,size);
 if(item.grade)u.text(n,'+'+item.grade,size*.29,-size*.32,l.nameFont,'#FFFFFF',size*.55,30);
 require('./notification-view').badge(book.host,n,'equipment-upgrade-'+item.id,size/2-3,size/2-3,()=>catalog.query(item.id,book.host.model.state).canUpgrade);
 return n;
}
/** 按三类显示全部装备，分页签滚动独立于底层章节地图。 */
function render(book){
 const l=config.layout,u=book.ui,groups=catalog.groups(book.host.model.state);
 const heights=groups.map(g=>l.header+Math.ceil(g.items.length/l.columns)*l.cellHeight+l.gap),content=book.viewport(heights.reduce((a,b)=>a+b,0));
 let y=book.layout.viewportHeight/2;
 groups.forEach((group,index)=>{
  u.box(content,'equipment-group-'+group.id,0,y-l.header/2,book.layout.viewportWidth-20,l.header-10,'#AA8965',false);
  u.text(content,group.name,0,y-l.header/2,30,'#FFFFFF',500,45);
  group.items.forEach((item,i)=>{
   const x=(i%l.columns-(l.columns-1)/2)*l.cellWidth,cy=y-l.header-l.icon/2-Math.floor(i/l.columns)*l.cellHeight;
   const n=icon(book,content,item,x,cy,l.icon);
   if(!item.active)u.text(n,'待开放',0,0,21,'#FFFFFF',100,35);
   if(item.revealed)u.text(content,item.name,x,cy-l.icon/2-17,l.nameFont,l.ink,l.cellWidth-2,35);

   n.on(book.cc.Node.EventType.TOUCH_END,event=>{event.propagationStopped=true;if(!book.dragged&&item.revealed)show(book,item.id);});
  });
  y-=heights[index];
 });
}
/** 中英文按字宽分行；长说明用滚动保留全文，不缩小字体或截断。 */
function wrap(value,width,font){
 return require('./detail-wrap').wrap(value,width,font);
}
/** 装备详情与进阶列表共享有界正文视口，所有正文均保留可访问区域。 */
function body(book,card,rows,scroll=0){
 const l=config.layout,u=book.ui,cc=book.cc,width=l.detailWidth-l.padding*2;
 const wrapped=rows.map(r=>({...r,lines:wrap(r.text,width,l.font)})),height=wrapped.reduce((n,r)=>n+r.lines.length*l.lineHeight+l.sectionGap,0),max=Math.max(0,height-l.viewportHeight);
 const viewport=u.node(card,'equipment-detail-scroll',0,l.viewportY,width,l.viewportHeight);viewport.addComponent(cc.Mask);
 const content=u.node(viewport,'equipment-detail-content',0,Math.min(max,scroll),width,height);let top=l.viewportHeight/2,start=null,base=0;
 for(const row of wrapped){const h=row.lines.length*l.lineHeight,label=u.text(content,row.lines.join('\n'),0,top-h/2,l.font,row.color||l.ink,width,h);label.horizontalAlign=cc.Label.HorizontalAlign.LEFT;label.enableWrapText=false;label.lineHeight=l.lineHeight;top-=h+l.sectionGap;}
 viewport.on(cc.Node.EventType.TOUCH_START,e=>{start=e.getUILocation();base=content.position.y;});
 viewport.on(cc.Node.EventType.TOUCH_MOVE,e=>{if(!start)return;const offset=Math.max(0,Math.min(max,base+e.getUILocation().y-start.y));content.setPosition(0,offset,0);});
 if(max)u.text(card,'上下滑动查看完整内容',0,l.viewportY-l.viewportHeight/2-19,18,l.muted,width,28);
 return content;
}
/** 属性展示与进阶共用条目查询；关闭后回到列表原滚动位置。 */
function show(book,id,mode='detail',message='',scroll=0,options={}){
 const host=book.host,u=book.ui,cc=book.cc,l=config.layout,item=catalog.query(id,host.model.state);
 if(config.feedback.hideFragmentHint&&message===config.text.noFragments)message='';
 if(options.equipped)item.revealed=true;
 book.modal.getChildByName('equipment-detail-overlay')?.destroy();
 const hint=book.modal.getChildByName('handbook-close-hint');if(hint)hint.active=false;
 const shade=u.box(book.modal,'equipment-detail-overlay',0,0,host.config.layout.width,host.config.layout.height,l.shade,false);shade.addComponent(cc.BlockInputEvents);
 const card=u.box(shade,'equipment-detail-card',0,0,l.detailWidth,l.detailHeight,l.detailBackground);card.addComponent(cc.BlockInputEvents);
 u.text(card,(item.revealed?item.name:config.concealed.name)+(item.revealed&&item.grade?' +'+item.grade:''),0,l.titleY,34,item.qualityStyle.color,l.detailWidth-30,50);
 icon(book,card,item,0,l.iconY,l.detailIcon);
 if(!item.revealed){u.text(card,!item.active?config.text.unavailable:item.condition||config.concealed.unobtained,0,0,28,l.muted,l.detailWidth-50,160);u.button(card,'关闭',0,l.buttonY,l.buttonWidth,()=>{shade.destroy();if(hint?.isValid)hint.active=true;});return shade;}
 const progress=item.max?config.text.max:item.fragments+'/'+(item.cost?.fragments||'—');
 const fragmentBar=require('./fragment-progress').draw(book,card,item,l.progressY,progress);
 if(require('./equipment-ad').eligible(host.model,id)){require('./notification-view').badge(host,fragmentBar,'fragment-ad-'+id,135,16,()=>require('./equipment-ad').eligible(host.model,id));fragmentBar.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;require('./equipment-ad-view').offer(book,id);});}
 const rows=mode==='upgrade'?[{text:config.text.upgradeTitle+' · '+item.grade+'/'+item.upgrades.length},...item.upgrades.map((text,i)=>({text:(i<item.grade?'已激活 · ':'第'+(i+1)+'阶 · ')+text,color:i<item.grade?l.active:l.ink})),{text:config.text.rule,color:l.muted}]:[
  {text:item.attributes.join('\n')},
  ...item.effects.map(text=>({text:'◇ '+text})),
  ...(item.exclusive?[{text:item.exclusive.description+(item.exclusive.implemented?'':'（待实现）'),color:item.exclusive.implemented?l.active:l.muted}]:[]),
  ...(item.grade?[{text:'已激活强化\n'+item.upgrades.slice(0,item.grade).join('\n'),color:l.active}]:[]),
  {text:item.lore.label+' · '+item.lore.title,color:l.muted},
  {text:item.lore.text,color:l.ink},
  ...(item.lore.source?[{text:'出处：'+item.lore.source.title,color:l.muted}]:[]),
 ];

 const content=body(book,card,rows,scroll);
 if(mode==='upgrade'){
  if(!item.max&&(host.model.state.meta.cleared||0)<item.requiredChapter){}
  else if(!item.max&&item.needsUnlock)u.button(card,'▶ 解锁进阶',0,l.buttonY,320,()=>{const ticket=host.model.adTicket();host.ad(()=>require('./equipment-unlock').unlock(host.model,id,ticket),()=>require('./equipment-ad-view').reopen(host,id));},l.ready,60);
  else if(!item.max)u.button(card,require('./equipment-ad').required(item)?'▶ 视频进阶':'进阶',0,l.buttonY,320,()=>{
   if(require('./equipment-ad').eligible(host.model,id)){require('./equipment-ad-view').offer(book,id);return;}
   if(item.canUpgrade&&require('./equipment-ad').required(item)){const ticket=host.model.adTicket();host.ad(()=>upgrades.upgrade(host.model,id,item.grade,ticket),()=>require('./equipment-ad-view').reopen(host,id,true));return;}
   try{upgrades.upgrade(host.model,id,item.grade);require('./notification-view').refresh(host);book.render();const upgraded=show(book,id,'upgrade','',content.position.y);require('./upgrade-feedback').play(host,upgraded,'equipment',0,l.iconY);}
   catch(error){show(book,id,'upgrade',error.message,content.position.y);}
  },item.canUpgrade?l.ready:l.muted,60);
  if(message)u.text(card,message,0,l.costY+l.costMessageOffset,22,l.ready,l.detailWidth-35,30);
  if(item.cost)require('./currency-view').amount(host,card,item.diamonds+'/'+item.cost.diamonds+' '+require('./equipment-upgrade-config').currencyName,0,l.costY-(message?l.costMessageOffset:0));
  else u.text(card,config.text.max,0,l.costY,22,l.ink,l.detailWidth-35,30);
 }else if(options.equipped){
  if(!options.readOnly&&!host.playing&&!host.model.state.pending)u.button(card,'卸下',0,l.buttonY,l.buttonWidth,options.onUnequip,l.ready,60);
  else if(!options.readOnly)u.text(card,'战斗结算后可卸下',0,l.buttonY,25,l.muted,l.detailWidth-30,60);
 }else if(item.active){
  u.button(card,config.text.upgrade,0,l.buttonY,l.buttonWidth,()=>show(book,id,'upgrade'),l.ready,60);
  if(!(config.feedback.hideFragmentHint&&item.reason===config.text.noFragments))u.text(card,item.max?config.text.max:item.reason||'材料齐备，可进阶',0,l.costY,22,item.canUpgrade?l.active:l.muted,l.detailWidth-35,65);
 }else u.text(card,config.text.unavailable,0,l.buttonY,28,l.muted,l.detailWidth-40,60);
 u.text(shade,options.equipped?'点击空白处关闭':mode==='upgrade'?'点击空白处返回详情':config.text.close,0,l.closeY,25,'#FFFFFF',650,45);
 shade.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;if(e.target===shade){if(mode==='upgrade')show(book,id,'detail','',0,options);else{shade.destroy();if(hint?.isValid)hint.active=true;}}});
 return shade;
}
module.exports={render,show,wrap,body};
