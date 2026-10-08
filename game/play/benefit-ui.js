"use strict";
/** 礼包面板复用纸张、按钮和阻挡事件，关闭后刷新宿主红点。 */
function panel(v,title,c){const shade=v.overlay(),p=v.paper(shade,'benefit-panel',0,0,c.width,c.height);p.addComponent(v.cc.BlockInputEvents);v.ui.text(p,title,0,c.titleY,36,'#674322',580,55);v.ui.text(shade,'点击空白处关闭',0,-c.height/2-35,27,'#FFFFFF',650,44);shade.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;if(e.target===shade){shade.destroy();v.modal=null;require('./notification-view').refresh(v);}});return p;}
/** 图片按钮接受滚动上下文，拖动结束时不误领礼包。 */
function button(v,p,text,x,y,w,action,color='red',scroll=null){const n=v.ui.node(p,text,x,y,w,62);v.ui.image(n,'classic/button-'+color+'.png',0,0,w,62);require('./button-content').draw(v.ui,n,text,27,'#FFE267',w-10,58);n.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;if(!scroll?.dragged)action();});return n;}
/** 有界滚动复用轻点阈值，偏移由视图持有而不写入玩家存档。 */
function scroll(v,p,name,x,y,width,height,total,offset=0,onOffset=()=>{}){const viewport=v.ui.node(p,name,x,y,width,height);viewport.addComponent(v.cc.Mask);const content=v.ui.node(viewport,name+'-content',0,Math.min(Math.max(0,total-height),offset),width,total),state={content,dragged:false};require('./scroll-gesture').bindScroll(v.cc,viewport,content,{min:0,max:Math.max(0,total-height),threshold:14,onDrag:d=>state.dragged=d,onOffset});return state;}
/** 奖励预览使用道具图与数量；随机碎片只在实际领取后解析。 */
function items(v,p,items,y,size=84,center=0,vipBonus=true){const entries=Object.entries(items);entries.forEach(([id,n],i)=>{const x=center+(i-(entries.length-1)/2)*(size+20),box=v.ui.box(p,'preview-'+id,x,y,size+6,size+6,id==='1'?'#A63224':'#3866A3');v.ui.image(box,require('./reward-icon').file(id),0,0,size,size);v.ui.text(box,id==='1'&&vipBonus?require('./vip').diamonds(v.model,n):n,5,-size*.3,25,'#FFFFFF',size,34);});}
/** 奖励事务成功后重绘当前弹窗，再显示具体入库回执。 */
function claim(v,operation,refresh,ad=false){let receipt;const done=()=>{receipt=null;receipt=operation();},after=()=>{if(!receipt)return;refresh();require('./activity-reward-view').show(v,receipt);require('./notification-view').refresh(v);};if(ad)v.ad(done,after);else{v.act(done);after();}}
module.exports={panel,button,scroll,items,claim};
