'use strict';
const fs=require('node:fs'),dir='evidence/route-failure-audit-1.0.221/boss-diagnosis',combat=require('../game/play/expedition-combat'),roster=require('../game/play/expedition-roster');
/** 原冻结Boss快照直接走新战斗入口，保持阵容、倍率和对照随机种子。 */
function main(){const rows=[];for(const seed of [101,307,911]){const attempts=JSON.parse(fs.readFileSync(`${dir}/seed-${seed}-raw.json`));for(let video=1;video<attempts.length;video++){
 const state=attempts[video].state,e=state.expedition.enemyEncounter,rules=require('../game/play/player-combat-context').snapshot(state,{...require('../game/play/config'),maxStar:5});let wins=0;
 for(let i=0;i<24;i++){const b=combat.simulate(state.units,e.units,roster,rules,405427+i*17,e.scale,state.expedition.equipment);wins+=b.result==='win';}
 rows.push({seed,video,wins,runs:24,assistance:rules.enemyCombatRelief});
 }}fs.writeFileSync('evidence/boss-relief-1.0.222.json',JSON.stringify(rows,null,2));console.log(JSON.stringify(rows));}
main();
