'use strict';
const c=require('./lord-blessing-config');
/** 只展示成功事务返回的赠将回执，不在动画或确认按钮中再次发奖。 */
function show(v,receipt){
 if(!receipt?.gift)return null;
 const gift=receipt.gift,hero=v.roster.find(h=>h.id===gift.heroId);
 if(!hero)return null;
 const u=v.ui,cc=v.cc,m=v.overlay();
 v.paper(m,'lord-blessing-title',0,c.titleY,630,105);
 u.text(m,c.title,0,c.titleY,42,'#705032',600,70);
 u.text(m,c.result+' · '+hero.name,0,c.nameY,38,'#FFE395',660,65);
 const fx={ui:u,cc,assets:v.assets,speed:1};
 require('./native-effects').play(fx,c.effect,m,0,c.effectY,{duration:c.duration,size:c.effectSize});
 const actor=u.actor(m,{...gift,side:'ally'},0,c.actorY,c.actorScale,false);
 u.face(actor,...c.facing);
 actor.node.setScale(c.startScale,c.startScale,1);
 const tween=cc.tween(actor.node).to(c.popSeconds,{scale:new cc.Vec3(1,1,1)},{easing:'backOut'}).start();
 require('./benefit-ui').button(v,m,c.confirm,0,c.buttonY,c.buttonWidth,()=>{m.destroy();v.modal=null;},'gold');
 m.once(cc.Node.EventType.NODE_DESTROYED,()=>{tween.stop();require('./native-effects').clear(fx);});
 return m;
}
module.exports={show};
