'use strict';
const c=require('./fortress-chapter-config');
/** 以实际建筑等级表生成章节权益，预告不能改变真实升级门槛。 */
function entries(chapter){if(!c.chapters.includes(chapter))return [];return [require('./diamond-mine-config'),...require('./fortress-panels-config').buildings].flatMap(policy=>policy.levels.filter(level=>level.lv>0&&level.chapter===chapter).map(level=>({policy,level:level.lv})));}
/** 根据当前永久通关数展示下一章建筑升级预告。 */
function entry(v){const chapter=v.progress.state.cleared+1,list=entries(chapter);if(!list.length)return false;const p=c.entry,n=v.ui.node(v.root,'fortress-chapter-preview',p.x,p.y,p.width,p.height);v.ui.image(n,list[0].policy.view.image,0,32,p.imageSize,p.imageSize);const lines=list.map(item=>(list.length>1?p.multiple:p.single).replace('{name}',item.policy.name).replace('{level}',item.level));v.ui.text(n,p.heading.replace('{chapter}',chapter)+'\n'+lines.join('\n'),0,p.captionY,list.length>1?p.multiFont:p.font,'#FFE49A',p.width,p.captionHeight);n.on(v.cc.Node.EventType.TOUCH_END,()=>show(v,chapter));return true;}
/** 同章多个建筑并列说明，可进入要塞查看真实状态与消费要求。 */
function show(v,chapter){const list=entries(chapter),l=c.panel,m=v.overlay(),p=v.paper(m,'fortress-chapter-paper',0,0,l.width,l.height),event=v.cc.Node.EventType.TOUCH_END;p.on(event,e=>{e.propagationStopped=true;});m.on(event,()=>{m.destroy();if(v.modal===m)v.modal=null;});require('./paper-title').draw(v,p,'通关第'+chapter+'章',l.width,l.height);list.forEach((item,i)=>{const y=l.rowTop-i*l.rowGap;v.ui.image(p,item.policy.view.image,l.imageX,y,l.imageSize,l.imageSize);v.ui.text(p,item.policy.name+'可升至 Lv'+item.level+'\n需逐级升级并消耗钻石',l.textX,y,l.font,'#65462B',l.textWidth,110);});v.ui.button(p,'前往要塞',0,l.buttonY,300,()=>{v.page='camp';v.fortOffset=Math.max(0,-list[0].policy.view.panelY);v.render();},'#B72B12');}
/** 在整章奖励页明确显示新开放的升级资格，不直接授予建筑等级。 */
function reward(v,parent,reward){if(!reward.resetChapter)return;const chapter=Number(reward.key.split('-')[0]),list=entries(chapter);if(!list.length)return;const l=c.reward;v.ui.text(parent,list.map(x=>x.policy.name+'可升至 Lv'+x.level).join(' · ')+'\n领取奖励后可前往要塞升级',0,l.y,l.font,l.color,l.width,l.height);}
module.exports={entries,entry,show,reward};
