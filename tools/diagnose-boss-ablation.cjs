'use strict';
const fs=require('node:fs'),req=id=>require('../game/play/'+id),dir='evidence/route-failure-audit-1.0.221/boss-diagnosis';
const raw=JSON.parse(fs.readFileSync(dir+'/seed-101-raw.json')),roster=req('expedition-roster'),combat=req('expedition-combat'),skills=req('hero-skills'),baseInitialize=skills.initialize;
const variants=[{id:'original',remove:[]},{id:'noHealingSkills',remove:['12092','13141']},{id:'noHooks',remove:['12091']},{id:'noHealingOrHooks',remove:['12092','13141','12091']},{id:'noZhouyuBurst',remove:['13134']},{id:'noEquipment',remove:[],equipment:false},{id:'noPercentRegen',remove:[],percentRegen:false},{id:'noHealing',remove:['12092','13141'],percentRegen:false,regen:false}];
/** 只在诊断进程里移除敌方指定能力，同一倍率、阵型与随机种子对照，绝不写回游戏配置。 */
function main(){const rows=[];try{for(let attempt=1;attempt<=4;attempt++)for(const variant of variants){
 const state=raw[attempt].state,e=state.expedition.enemyEncounter,rules=req('player-combat-context').snapshot(state,{...req('config'),maxStar:5});
 skills.initialize=(units,events)=>{for(const u of units)if(u.side==='enemy'){u.skills=(u.skills||[]).filter(s=>!variant.remove.includes(s.id));if(variant.percentRegen===false)u.regenPercent=0;if(variant.regen===false)u.regen=0;}baseInitialize(units,events);};
 const enemies=structuredClone(e.units);if(variant.equipment===false)enemies.forEach(u=>u.equipment=[]);
 let wins=0,enemyAlive=0,healing=0;for(let i=0;i<24;i++){
  const b=combat.simulate(state.units,enemies,roster,rules,405427+i*17,e.scale,state.expedition.equipment);wins+=b.result==='win';enemyAlive+=b.final.filter(u=>u.side==='enemy'&&u.hp>0).length;healing+=b.events.filter(ev=>ev.type==='heal'&&ev.target<0).reduce((n,ev)=>n+ev.amount,0);
 }
 rows.push({attempt,variant:variant.id,wins,runs:24,enemyAlive:enemyAlive/24,enemyHealing:healing/24,scale:e.scale});
 }}finally{skills.initialize=baseInitialize;}
 fs.writeFileSync(dir+'/ablation.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));}
main();
