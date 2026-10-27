'use strict';
const c=require('./xiaoqiao-skill-view-config'),native=require('./native-effects');
/** 技能弹道使用真实施法目标和命中延迟，普攻仍使用独立飞扇。 */
function ability(v,a,b,e){const r=c.projectiles[e.skillId];if(a?.unit?.heroId!==c.hero||!r||!b?.node?.isValid)return false;const p=a.node.position,q=b.node.position;native.play(v,r.id,v.root,p.x,p.y+c.offsetY,{size:r.size,color:r.color,duration:e.impactDelay,angle:Math.atan2(q.y-p.y,q.x-p.x)*180/Math.PI,travel:{x:q.x,y:q.y+c.offsetY},followTarget:b.node,targetOffsetY:c.offsetY});return true;}
/** 凝霜屏包住受保护友军，显示真实三秒控制时长，不误呈现为无敌。 */
function status(v,a,e){if(e.effect!=='frostScreen'||!a?.node?.isValid)return false;if(a.frostScreenEffect?.isValid)a.frostScreenEffect.destroy();v.ui.animate(a,'idle',true,{speed:v.speed});a.frostScreenEffect=native.play(v,c.screen.id,a.node,0,c.screen.y,{size:c.screen.size,color:c.screen.color,duration:e.duration,loop:true});return true;}
/** 流霜焰以冰霜爆裂呈现，仅在实际命中事件播放。 */
function hit(v,a,e){if(e.effect!=='frostFlame'||!a?.node?.isValid)return false;native.play(v,c.impact.id,a.node,0,c.offsetY,{size:c.impact.size,color:c.impact.color,duration:c.impact.duration});return true;}
module.exports={ability,status,hit};
