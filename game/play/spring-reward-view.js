'use strict';
const c=require('./spring-reward-config'),shown=new WeakMap();
/** 读取成功事务的奖励凭据，兼容旧存档只有 equipment 字段的装备奖励。 */
function result(event){return event.extraResult||event.result||{kind:'equipment',id:event.equipment};}
/** 获取装备/武将共用获取光芒，升级在获取武将的同时叠加原生升级光效。 */
function show(v,event){
 const r=result(event),u=v.ui,cc=v.cc,layer=u.node(v.root,'spring-reward'),tweens=[];
 let keys=shown.get(v);if(!keys){keys=new Set();shown.set(v,keys);}const fresh=!keys.has(event.key);keys.add(event.key);
 if(fresh)tweens.push(require('./acquisition-effect').play(v,layer,r.kind==='equipment'?'equipment':'hero',0,c.centerY+c.effectY,require('./acquisition-effect-config').springRadius));
 let focus;
 if(r.kind==='equipment')focus=require('./equipment-reward-card').draw(u,layer,r.id,require('./equipment-reward-card-config').spring,'spring-equipment').item;
 else {focus=u.node(layer,'spring-reward-display',0,c.centerY);u.actor(focus,{uid:r.awardedUid||r.uid,heroId:r.heroId,star:r.star,slot:-1},0,0,c.modelScale,false);}
 if(fresh){const style=r.kind==='equipment'?require('./lord-skill-animation-config'):require('./hero-unlock-config');focus.setScale(c.startScale,c.startScale,1);tweens.push(cc.tween(focus).to(style.popSeconds,{scale:new cc.Vec3(1,1,1)},{easing:'backOut'}).start());if(r.kind==='upgrade')require('./native-effects').play(v,c.effect,layer,0,c.centerY+c.effectY,{size:c.effectSize,duration:c.effectDuration});}
 if(r.kind!=='equipment'){const name=v.roster.find(hero=>hero.id===r.heroId)?.name;u.text(layer,c.name.heroTemplate.replace('{star}',r.star).replace('{name}',name||''),0,c.name.y,c.name.font,c.name.heroColor,c.name.width,c.name.height);}
 if(event.extraResult){const f=require('./sunquan-skill-config').feedback,first=event.result,extra=event.extraResult,name=id=>v.roster.find(h=>h.id===id)?.name||id;u.text(layer,'泉水升级：'+name(first.heroId)+' '+first.star+'阶\n孙权追加：'+name(extra.heroId)+' '+extra.star+'阶',0,f.y,f.font,f.color,f.width,f.height);}
 layer.on(cc.Node.EventType.NODE_DESTROYED,()=>tweens.forEach(t=>t.stop()));return layer;
}
module.exports={show,result};
