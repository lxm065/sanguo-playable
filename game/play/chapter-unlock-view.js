'use strict';
const c={chapter:3,id:'7208',name:'疯脸',title:'通关预告',hint:'疯狂面具彻底疯狂了！'};
/** 首页进阶入口按实际装备章节门槛显示，不伪造免费强化等级。 */
function entry(v){if(v.progress.state.cleared<2||v.progress.state.cleared>=c.chapter)return false;const n=v.ui.node(v.root,'chapter-upgrade-preview',284,295,154,215);v.ui.image(n,'equipment/'+c.id+'.png',0,32,110,110);v.ui.text(n,'进阶\n通关第3章解锁',0,-58,25,'#FFE49A',160,96);n.on(v.cc.Node.EventType.TOUCH_END,()=>show(v));return true;}
/** 展示本章解锁的进阶功能；具体属性和费用仍由图鉴共用配置决定。 */
function show(v){const m=v.overlay();const panel=v.paper(m,'chapter-upgrade-paper',0,0,654,640);require('./paper-title').draw(v,panel,c.title,654,640);v.ui.text(m,'通关第 '+c.chapter+' 章解锁\n['+c.name+']进阶',0,153,34,'#65462B',580,130);v.ui.image(m,'equipment/'+c.id+'.png',-139,-20,135,135);v.ui.text(m,'➜',0,-20,58,'#54A442',100,100);v.ui.image(m,'equipment/'+c.id+'.png',139,-20,160,160);v.ui.text(m,'可进阶',139,-122,26,'#268ADA',200,48);v.ui.text(m,c.hint,0,-215,29,'#65462B',580,70);}
module.exports={entry,show,config:c};
