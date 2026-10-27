'use strict';
const c=require('./northern-weapons-config');
/** 固定冷却从获得强化起算，期间施法不会反复刷新五秒窗口。 */
function afterCast(a,t,events){const r=c.blade;if(a.hp<=0||!require('./weapon-exclusive').active(a,r.id)||t<(a.hebeiNext||0))return;a.hebeiNext=t+r.cooldown;a.hebeiReadyUntil=t+r.readyDuration;events.push({type:'equipment',exclusive:true,id:r.id,uid:a.uid,target:a.uid,t,phase:'ready',duration:r.readyDuration});}
/** 到期清除未消费强化，后续普攻不能补领过期重劈。 */
function tick(a,t,events){if(a.hebeiReadyUntil!==undefined&&t>=a.hebeiReadyUntil){delete a.hebeiReadyUntil;events.push({type:'equipment',exclusive:true,id:c.blade.id,uid:a.uid,target:a.uid,t,phase:'end'});}}
/** 根据实际普攻方向选择贯穿目标，按射线距离排序，排除身后与旁侧单位。 */
function line(a,target,units){const r=c.bow,dx=target.x-a.x,dy=target.y-a.y,length=Math.hypot(dx,dy)||1;return units.filter(u=>u.side!==a.side&&require('./combat-protection').targetable(u)).map(u=>({u,along:((u.x-a.x)*dx+(u.y-a.y)*dy)/length,across:Math.abs((u.x-a.x)*dy-(u.y-a.y)*dx)/length})).filter(p=>p.along>0&&p.along<=r.range&&p.across<=r.halfWidth).sort((x,y)=>x.along-y.along||x.u.uid-y.u.uid).slice(0,r.targets);}
/** 仅由普通攻击出手入口调用一次，技能、追击、魅惑攻击不能增加计数。 */
function attack(a,target,units,t,hits,events,rules){
 if(a.hp<=0)return;tick(a,t,events);const active=require('./weapon-exclusive').active;
 if(active(a,c.blade.id)&&a.hebeiReadyUntil>t){delete a.hebeiReadyUntil;const dx=target.x-a.x,dy=target.y-a.y;hits.push({at:t+rules.attackDelay,a,northernArea:true,dx,dy});events.push({type:'equipment',exclusive:true,id:c.blade.id,uid:a.uid,target:target.uid,t,phase:'swing',duration:rules.attackDelay});}
 if(!active(a,c.bow.id))return;a.frostPierceCount=(a.frostPierceCount||0)+1;if(a.frostPierceCount<c.bow.attacks)return;a.frostPierceCount=0;
 const targets=line(a,target,units),dx=target.x-a.x,dy=target.y-a.y,length=Math.hypot(dx,dy)||1;
 for(const {u,along}of targets)hits.push({at:t+Math.max(c.bow.minTravel,c.bow.travel*along/c.bow.range),a,u,skill:true,critical:false,power:c.bow.power,effect:c.bow.effect,northernStrike:'bow',s:{physical:true}});
 events.push({type:'equipment',exclusive:true,id:c.bow.id,uid:a.uid,target:target.uid,t,phase:'fire',duration:c.bow.travel,dx:dx/length,dy:dy/length,range:c.bow.range});
}
/** 落刀时重取当前周围目标，正面120度扇区包含斜邻格，身后不受伤。 */
function area(hit,units,t,events){const a=hit.a,r=c.blade;if(a.hp<=0||require('./charm-exclusive').active(a,t))return [];events.push({type:'equipment',exclusive:true,id:r.id,uid:a.uid,target:a.uid,t,phase:'impact',dx:hit.dx,dy:hit.dy});const length=Math.hypot(hit.dx,hit.dy)||1;return units.filter(u=>{const x=u.x-a.x,y=u.y-a.y,d=Math.hypot(x,y);return u.side!==a.side&&require('./combat-protection').targetable(u)&&d>0&&Math.max(Math.abs(x),Math.abs(y))<=r.radius&&(x*hit.dx+y*hit.dy)/(d*length)>=Math.cos(r.halfAngle*Math.PI/180)-1e-8;}).map(u=>({at:t,a,u,skill:true,critical:false,power:r.power,effect:r.effect,northernStrike:'blade',s:{physical:true}}));}
/** 实际命中后施加破甲或减速；同名破甲覆盖刷新，不复合叠加。 */
function afterHit(hit,t,events){const u=hit.u;if(u.negativeImmune||!hit.northernStrike||u.hp<=0||require('./combat-protection').protectedUnit(u)||require('./xuchu-survival').invulnerable(u,t))return;
 if(hit.northernStrike==='blade'){const r=c.blade,old=u.buffs?.['hebei-armor'],base=u.armor-(old?.values.armor||0);require('./hero-skills').buff(u,'hebei-armor',{armor:-Math.max(0,base)*r.armorReduction},t+r.armorDuration);events.push({type:'status',t,target:u.uid,effect:'armorBreak',duration:r.armorDuration});}
 else{const r=c.bow,duration=require('./enemy-relief').duration(hit.a,r.duration);u.equipmentSlow=Math.max(u.equipmentSlowUntil>t?u.equipmentSlow||0:0,r.slow);u.equipmentSlowUntil=Math.max(u.equipmentSlowUntil||0,t+duration);events.push({type:'status',t,target:u.uid,effect:'slow',duration});}
}
module.exports={afterCast,tick,line,attack,area,afterHit};
