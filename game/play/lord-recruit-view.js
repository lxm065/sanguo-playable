'use strict';
const c=require('./lord-recruit-view-config');
/** 征召开场使用主公圆头像与三国台词横幅，原始立绘只读。 */
function intro(v,parent,lord){const p=c.panel,n=v.paper(parent,'recruit-dialogue',p.x,p.y,p.width,p.height),head=v.ui.node(n,'recruit-lord',p.portraitX,0,p.portraitSize,p.portraitSize),mask=head.addComponent(v.cc.Mask);mask.type=v.cc.Mask.Type.ELLIPSE;v.ui.portrait(head,lord.portrait,0,0,p.portraitSize,p.portraitSize,require('./classic-config').portraitCrop);v.ui.text(n,c.line,p.textX,0,p.font,'#614726',p.textWidth,p.height-20);return n;}
/** 已到账武将以真实动态模型、等级姓名与光效短暂展示，不再发奖。 */
function result(v,a,r){const cHero=c.hero,h=v.roster.find(h=>h.id===r.id);if(!h)return;v.ui.text(a.root,r.star+'级  '+h.name,0,cHero.nameY,cHero.font,cHero.color,cHero.nameWidth,60);const actor=v.ui.actor(a.root,{uid:'recruit-result',heroId:r.id,star:r.star,side:'enemy'},cHero.x,cHero.y,cHero.scale,false);v.ui.face(actor,...cHero.facing);actor.node.setScale(cHero.startScale,cHero.startScale,1);a.targets.push(actor.node);v.cc.tween(actor.node).to(require('./lord-skill-animation-config').popSeconds,{scale:new v.cc.Vec3(1,1,1)},{easing:'backOut'}).start();}
module.exports={intro,result};
