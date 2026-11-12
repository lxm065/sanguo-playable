'use strict';
const fs=require('node:fs'),root='evidence/route-failure-audit-1.0.221/boss-diagnosis',roster=require('../game/play/expedition-roster'),combat=require('../game/play/expedition-combat');
/** 三个历史卡关阵容保持当前引擎、同目标、同种子；只对照是否计入机制预算。 */
function main(){const rows=[];for(const seed of [101,307,911]){
 const attempts=JSON.parse(fs.readFileSync(`${root}/seed-${seed}-raw.json`));for(let video=1;video<=3;video++){
  const state=attempts[video].state,e=state.expedition.enemyEncounter,rules=require('../game/play/player-combat-context').snapshot(state,{...require('../game/play/config'),maxStar:5}),equipment=require('../game/play/enemy-equipment').collect(e.units),cost=require('../game/play/enemy-mechanism-budget').query(e.units,roster,rules,equipment);
  const staticEnemy=require('../game/play/strongest-team').score(e.units,roster,{...rules,playerTalent:{},playerTalentTree:{},playerEquipmentGrades:{},playerVip:null,playerBonds:undefined},equipment),scale=e.lightBalance.own/staticEnemy*e.lightBalance.curve;
  for(const variant of ['previous','optimized']){let wins=0;for(let i=0;i<24;i++){const b=combat.simulate(state.units,e.units,roster,rules,405427+i*17,scale/(variant==='optimized'?cost.factor:1),state.expedition.equipment);wins+=b.result==='win';}rows.push({seed,video,variant,wins,runs:24,mechanism:cost});}
 }}fs.mkdirSync('evidence/difficulty-optimization-1.0.282',{recursive:true});fs.writeFileSync('evidence/difficulty-optimization-1.0.282/bosses.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));}
main();
