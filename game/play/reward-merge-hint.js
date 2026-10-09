'use strict';
const c=require('./combat-feedback-config').rewardMerge;
/** 按领取后的同名同阶数量判断，场上和备战席合计，最高阶不提示。 */
function available(model,id,star){return star<model.maxRank()&&model.state.units.filter(u=>u.heroId===id&&u.star===star).length+1>=model.rules.mergeCount;}
/** 奖励卡下方展示合成提示，不替玩家领取或执行合成。 */
function draw(v,parent,id,star,x){if(!available(v.model,id,star))return;frame(v,parent,x);const n=v.ui.box(parent,'reward-merge-hint',x,c.y,c.width,c.height,c.background,false);v.ui.text(n,c.text,0,0,c.font,c.color,c.width,c.height);return n;}
/** 可合成选项用双线框包住整张卡片，透明内部不遮挡内容或拦截按钮触摸。 */
function frame(v,parent,x){const p=c.frame,n=v.ui.node(parent,'reward-merge-frame',x,p.y,p.width,p.height),g=n.addComponent(v.cc.Graphics);g.strokeColor=new v.cc.Color(p.color);g.lineWidth=p.lineWidth;g.roundRect(-p.width/2,-p.height/2,p.width,p.height,p.radius);g.stroke();g.strokeColor=new v.cc.Color(p.innerColor);g.lineWidth=p.innerWidth;g.roundRect(-p.width/2+p.inset,-p.height/2+p.inset,p.width-p.inset*2,p.height-p.inset*2,p.radius);g.stroke();return n;}
module.exports={available,draw};
