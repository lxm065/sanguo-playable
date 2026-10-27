'use strict';
const c=require('./zhurong-skill-view-config'),native=require('./native-effects');
/** 原生刀光携带火焰飞向目标；所有视觉节点由原生特效池按倍速和离场统一回收。 */
function launch(v,a,b,style,duration){const p=a.node.position,q=b.node.position,start={x:p.x,y:p.y+c.offsetY};for(const [ox,oy]of style.offsets||[[0,0]]){const end={x:q.x+ox,y:q.y+c.offsetY+oy},angle=Math.atan2(end.y-start.y,end.x-start.x)*180/Math.PI;
 native.play(v,c.flame,v.root,start.x,start.y,{size:style.flameSize,duration,travel:end,angle,color:c.color,fadeOut:c.fade});native.play(v,c.blade,v.root,start.x,start.y,{size:style.size,duration,travel:end,angle,spin:c.spin,color:c.edge,fadeOut:c.fade});
 if(style.returning)native.play(v,c.blade,v.root,end.x,end.y,{size:style.size,duration:c.returnDuration,delay:duration,travel:start,angle:angle+180,spin:-c.spin,color:c.color,fadeOut:c.fade});}}
/** 三种主动技能均从祝融出手，目标周围的命中光只由真实伤害事件播放。 */
function ability(v,a,b,e){const style=c.skills[e.effect];if(a?.unit?.heroId!==c.hero||!style)return false;if(a.node?.isValid&&b?.node?.isValid){if(e.effect==='blazingVolley')require('./blazing-volley-view').cast(v,a,b,e);else launch(v,a,b,style,e.impactDelay||v.config.attackDelay);}return true;}
/** 普攻也改为小型火焰飞刃，避免神射继续发射水球。 */
function projectile(v,a,b){if(a?.unit?.heroId!==c.hero)return false;if(a.node?.isValid&&b?.node?.isValid)launch(v,a,b,c.normal,v.config.attackDelay);return true;}
/** 每名实际受伤敌人单独播放火刃爆光，无伤害事件不提前爆炸。 */
function hit(v,a,b,e){const style=c.skills[e.effect];if(a?.unit?.heroId!==c.hero||!style)return false;if(e.effect==='blazingVolley'){if(b?.node?.isValid)require('./blazing-volley-view').hit(v,a,b,e);return true;}if(b?.node?.isValid)native.play(v,c.impact,b.node,0,c.offsetY,{size:style.impactSize,duration:style.impactDuration,color:c.color,fadeOut:c.fade});return true;}
/** 双防被动在入场时短暂显现藤金护甲光，不伪装成可消耗的护盾。 */
function status(v,a,e){if(a?.unit?.heroId!==c.hero||e.skillId!=='14212')return false;if(a.node?.isValid)native.play(v,c.armor,a.node,0,c.offsetY,{size:c.armorSize,duration:c.armorDuration,color:c.armorColor,fadeOut:c.fade});return true;}
module.exports={ability,projectile,hit,status};
