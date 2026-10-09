'use strict';
const c=require('./march-exit-config');
/** 红蓝图片按钮拦截触摸，避免点击穿透到路线。 */
function button(v,parent,label,y,color,action){const n=v.ui.node(parent,label,0,y,c.buttonWidth,c.buttonHeight);v.ui.image(n,'classic/button-'+color+'.png',0,0,c.buttonWidth,c.buttonHeight);v.ui.text(n,label,0,0,c.font,'#FFE35C',c.buttonWidth-18,c.buttonHeight-12);n.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;action();});}
/** 保存退出保留路线位置；主动投降后重置视图位置，重新开始当前章。 */
function show(v){const shade=v.overlay(),p=v.paper(shade,'march-exit',0,0,c.width,c.height);p.addComponent(v.cc.BlockInputEvents);require('./paper-title').draw(v,p,c.title,c.width,c.height);button(v,p,c.save,c.saveY,'red',()=>v.act(()=>{v.progress.saveExit();v.page='home';}));button(v,p,c.surrender,c.surrenderY,'blue',()=>v.act(()=>{v.progress.surrender();v.mapOffset=0;v.page='home';}));v.ui.text(shade,c.close,0,-c.height/2-34,26,'#FFFFFF',c.width,50);shade.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;if(e.target===shade){shade.destroy();v.modal=null;}});}
module.exports={show};
