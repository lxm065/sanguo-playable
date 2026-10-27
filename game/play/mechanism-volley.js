'use strict';
const id='7006',c=()=>require('./weapon-exclusive-config')[id];
/** 每次本体主动施法只启动一组齐射，多重施法与同名装备不复制组数。 */
function activate(a,t,hits,events){if(a.hp<=0||!require('./weapon-exclusive').active(a,id))return;const r=c(),cast=a.mechanismSerial=(a.mechanismSerial||0)+1;events.push({type:'equipment',exclusive:true,id,uid:a.uid,target:a.uid,t,phase:'deploy',cast,duration:r.deploy+(r.waves-1)*r.interval+r.travel+r.visual.fade});for(let wave=0;wave<r.waves;wave++)hits.push({at:t+r.deploy+wave*r.interval,a,mechanismVolley:true,wave,cast});}
/** 每轮重新读取可选敌人，优先近敌并轮流分配；不足三人时允许集中射击。 */
function launch(job,units,t,hits,events){const a=job.a,r=c();if(a.hp<=0||require('./charm-exclusive').active(a,t))return;const targets=units.filter(u=>u.side!==a.side&&require('./combat-protection').targetable(u)).sort((x,y)=>Math.abs(x.x-a.x)+Math.abs(x.y-a.y)-Math.abs(y.x-a.x)-Math.abs(y.y-a.y)||x.uid-y.uid);if(!targets.length)return;for(let bow=0;bow<r.bows;bow++){const u=targets[(job.wave*r.bows+bow)%targets.length];hits.push({at:t+r.travel,a,u,skill:true,critical:false,power:r.power,effect:r.effect,s:{physical:true}});events.push({type:'equipment',exclusive:true,id,uid:a.uid,target:u.uid,t,phase:'fire',cast:job.cast,bow,wave:job.wave,duration:r.travel});}}
module.exports={activate,launch};
