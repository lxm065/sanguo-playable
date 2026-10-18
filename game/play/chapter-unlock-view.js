'use strict';
const registry=require('./chapter-upgrade-preview-config'),c=registry.entries[0],style=registry.view;
/** 按永久通关进度选择当前章节预告。 */
function current(v){return registry.entries.find(e=>v.progress.state.cleared>=e.previewAfter&&v.progress.state.cleared<e.chapter);}
/** 等级标记嵌在图片右下角，布局随图标尺寸计算。 */
function icon(v,parent,c,x,y,size){const n=v.ui.image(parent,'equipment/'+c.id+'.png',x,y,size,size);if(c.previewGrade){const label=v.ui.text(n,'+'+c.previewGrade,size/2-style.badgeInset-style.badgeWidth/2,-size/2+style.badgeInset+style.badgeHeight/2,style.badgeFont,style.badgeColor,style.badgeWidth,style.badgeHeight);label.isBold=true;const outline=label.node.addComponent(v.cc.LabelOutline);outline.color=new v.cc.Color(style.badgeOutline);outline.width=style.badgeOutlineWidth;}return n;}
/** 首页入口仅显示章节门槛，防止窄列文字折行。 */
function entry(v){const c=current(v);if(!c)return false;const n=v.ui.node(v.root,'chapter-upgrade-preview',284,295,154,215);icon(v,n,c,0,32,110);v.ui.text(n,c.chapter+'章解锁',0,style.entryCaptionY,25,'#FFE49A',160,style.entryCaptionHeight);n.on(v.cc.Node.EventType.TOUCH_END,()=>show(v,c));return true;}
/** 面板拦截点击，外部空白与关闭提示冒泡到遮罩后关闭。 */
function show(v,c=current(v)||registry.entries[0]){const m=v.overlay(),event=v.cc.Node.EventType.TOUCH_END,panel=v.paper(m,'chapter-upgrade-paper',0,0,654,640);panel.on(event,e=>{e.propagationStopped=true;});m.on(event,e=>{e.propagationStopped=true;m.destroy();if(v.modal===m)v.modal=null;});require('./paper-title').draw(v,panel,c.title,654,640);v.ui.text(panel,'通关第 '+c.chapter+' 章解锁\n['+c.name+']进阶',0,153,34,'#65462B',580,130);v.ui.image(panel,'equipment/'+c.id+'.png',-139,-20,135,135);v.ui.text(panel,'➜',0,-20,58,'#54A442',100,100);icon(v,panel,c,139,-20,160);if(!c.previewGrade)v.ui.text(panel,'可进阶',139,-122,26,'#268ADA',200,48);v.ui.text(panel,c.hint,0,-215,29,'#65462B',580,70);v.ui.text(m,style.close,0,style.closeY,26,'#FFFFFF',580,48);}
module.exports={entry,show,current,icon,config:c};
