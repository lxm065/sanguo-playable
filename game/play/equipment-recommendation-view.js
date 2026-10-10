'use strict';
const c=require('./battle-hud-config').targeting,frame=require('./equipment-exclusive-frame-config');
/** 专属身份单独查询，不能覆盖原有攻击类型、职业和射程推荐。 */
function targets(item,units,equipment){const recommended=new Set(require('./battle-hud-query').recommendedUnits(item,units,equipment)),exclusive=require('./equipment-exclusive-config').items[item.id]||[];return units.map(u=>({uid:u.uid,recommended:recommended.has(u.uid),exclusive:exclusive.includes(u.heroId)})).filter(u=>u.recommended||u.exclusive);}
/** 绘制四条透明内部的红框边，挂在同一提示节点上统一清理。 */
function border(v,parent){const f=frame;for(const [name,x,y,w,h]of [['top',0,f.y+f.height/2,f.width,f.border],['bottom',0,f.y-f.height/2,f.width,f.border],['left',-f.width/2,f.y,f.border,f.height],['right',f.width/2,f.y,f.border,f.height]])v.ui.box(parent,'exclusive-'+name,x,y,w,h,f.color,false);}
/** 远征与挑战共用两种独立提示；同一武将可同时拥有推荐标签与专属红框。 */
function show(v,item,units,equipment){return targets(item,units,equipment).flatMap(t=>{const actor=v.actors.get(t.uid);if(!actor)return [];const n=v.ui.box(actor.node,t.recommended?'equipment-recommended':'equipment-exclusive',0,c.recommendY,c.recommendWidth,c.recommendHeight,c.background,false);v.ui.text(n,t.exclusive?'专属':'推荐',0,0,c.recommendFont,c.textColor,c.recommendWidth-6,c.recommendHeight);if(t.exclusive)border(v,n);return [n];});}
module.exports={show,targets};
