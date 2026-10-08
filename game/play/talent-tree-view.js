'use strict';
const service=require('./talent-tree'),c=require('./talent-tree-config');
/** 关闭子窗口只刷新红点，保留天赋页、滚动位置与未提交内容。 */
function close(v){v.talentTreeModal?.destroy();v.talentTreeModal=null;require('./notification-view').refresh(v);}
/** 创建可滚动的三系树，布局及分叉边沿用原版17节点结构。 */
function open(v,page=v.talentTreePage||0){
 if(v.model.activities.state.talent.level<c.unlockLevel){v.notice('天赋加点','天赋等级1级解锁');return;}
 close(v);v.talentTreePage=page;const u=v.ui,cc=v.cc,l=c.layout,m=v.overlay();v.talentTreeModal=m;
 const panel=u.box(m,'talent-tree-panel',0,0,l.width,l.height,'#4D392A');panel.addComponent(cc.BlockInputEvents);u.image(panel,'talents/tree-board.png',0,0,l.width,l.height);
 u.text(panel,c.text.title+v.model.activities.state.talent.points,0,l.titleY,34,'#FFE9B4',500,55);
 u.button(panel,'×',290,l.titleY,60,()=>close(v),'#843D28',60);
 const viewport=u.node(panel,'talent-tree-scroll',0,l.viewportY,l.viewportWidth,l.viewportHeight);viewport.addComponent(cc.Mask);
 const max=l.rowGap*5+l.icon-l.viewportHeight+l.viewportHeight/2-l.top;
 v.talentTreeOffsets=v.talentTreeOffsets||{};const content=u.node(viewport,'talent-tree-content',0,v.talentTreeOffsets[page]||0,l.viewportWidth,1200);
 require('./scroll-gesture').bindScroll(cc,viewport,content,{threshold:l.dragThreshold,min:0,max,onDrag:d=>v.talentTreeDragged=d,onOffset:y=>v.talentTreeOffsets[page]=y});
 const items=service.nodes(v.model,page),lines=u.node(content,'talent-tree-edges'),g=lines.addComponent(cc.Graphics);g.strokeColor=new cc.Color(l.line);g.fillColor=new cc.Color(l.line);g.lineWidth=7;
 for(const q of items){const [x,row]=c.positions[q.index],y=l.top-row*l.rowGap;for(const id of q.parents){const parent=items.find(e=>e.id===id),[px,pr]=c.positions[parent.index],py=l.top-pr*l.rowGap-l.icon/2-8,target=y+l.icon/2+10,mid=(py+target)/2;g.moveTo(px,py);g.lineTo(px,mid);g.lineTo(x,mid);g.lineTo(x,target+12);g.stroke();g.moveTo(x-12,target+18);g.lineTo(x,target);g.lineTo(x+12,target+18);g.close();g.fill();}}
 for(const q of items){const [x,row]=c.positions[q.index],y=l.top-row*l.rowGap,n=u.box(content,'talent-node-'+q.id,x,y,l.icon+8,l.icon+8,q.locked?l.locked:l.ready,false),icon=u.image(n,'talents/'+q.id+'.png',0,0,l.icon,l.icon);icon.getComponent(cc.Sprite).grayscale=q.locked;
  u.box(n,'talent-rank',20,-38,62,30,'#242424',false);u.text(n,q.rank+'/'+q.max_lv,20,-38,23,q.locked?'#FFFFFF':'#85EC5D',62,32);
  require('./notification-view').badge(v,n,'talent-'+q.id,45,45,()=>service.query(v.model,q.id).canUpgrade);
  n.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;if(!v.talentTreeDragged)detail(v,q.id);});
 }
 c.tabs.forEach((name,i)=>{const tab=u.button(panel,name,(i-1)*210,l.tabY,195,()=>open(v,i),page===i?'#B48C37':'#806346',65);require('./notification-view').badge(v,tab,'tree-page-'+i,85,26,()=>service.nodes(v.model,i).some(q=>q.canUpgrade));});
 u.button(panel,c.text.get,-155,l.buttonY,l.buttonWidth,()=>points(v,false),'#166A9F',l.buttonHeight);
 u.button(panel,c.text.reset,155,l.buttonY,l.buttonWidth,()=>points(v,true),'#A53724',l.buttonHeight);
 m.on(cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;if(e.target===m)close(v);});
}
/** 属性预览保留当前、下一级、前置和两种消耗，操作再次校验最新状态。 */
function detail(v,id){
 const q=service.query(v.model,id),u=v.ui,l=c.layout,m=u.box(v.talentTreeModal,'talent-node-detail-shade',0,0,720,1280,'#000000AA',false);m.addComponent(v.cc.BlockInputEvents);
 const p=u.box(m,'talent-node-detail',0,0,610,830,l.paper);p.addComponent(v.cc.BlockInputEvents);
 u.text(p,q.name+' '+q.rank+'/'+q.max_lv,0,343,34,l.ink,550,60);u.image(p,'talents/'+id+'.png',0,241,110,110);
 u.text(p,'当前效果\n'+service.description(id,q.rank),0,95,28,l.ink,535,150);
 if(!q.max)u.text(p,'下一级\n'+service.description(id,q.rank+1),0,-69,28,l.ink,535,150);
 const condition=q.locked?'前置满级：'+q.parents.map(id=>service.query(v.model,id).name).join('、'):q.max?'已达满级':'消耗 '+q.need_num+' 天赋点 ＋ '+q.need_money+' 钻石';u.text(p,condition,0,-210,26,l.ink,535,80);
 u.button(p,q.canUpgrade?'升级':q.reason,0,-311,380,()=>{try{service.upgrade(v.model,id,q.rank);open(v,q.page);const upgraded=detail(v,id);require('./notification-view').refresh(v);require('./upgrade-feedback').play(v,upgraded,'talent',0,241);}catch(e){v.notice('提示',e.message);}},q.canUpgrade?'#287A4B':'#796650',70);
 u.button(p,'×',260,343,60,()=>{m.destroy();},'#8B5738',55);return m;
}
/** 获取和重置沿用现有广告适配器，取消与开发模拟未完成均不提交。 */
function points(v,reset){
 const token=service.ticket(v.model),s=service.state(v.model),count=service.remaining(v.model),used=Object.values(s.levels).some(n=>n>0),title=reset?c.text.reset:c.text.get;
 v.notice(title,reset?c.text.resetBody:'待领取：'+count+' 点\n广告进度：'+s.adProgress+'/'+c.adsPerPoint+'\n提升天赋等级可增加领取额度');
 if(reset?used:count>0)v.ui.button(v.modal,'▶ '+(reset?'重置并返还':'观看广告'),0,-82,320,()=>v.ad(()=>reset?service.reset(v.model,token):service.claim(v.model,token),()=>open(v,v.talentTreePage)),'#A53724',64);
}
module.exports={open,close,detail,points};
