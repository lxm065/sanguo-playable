'use strict';
const c=require('./strongest-team-config'),policy=require('./expedition-config');
const cache=new WeakMap();
/** 从持久化培养信息生成只读上下文，供未持有领域模型的敌军生成入口共用。 */
function context(state,rules){return require('./player-combat-context').snapshot(state,rules);}
/** 规范化虚拟站位，近战前排、远程后排；不读取或修改玩家实际部署。 */
function formation(units,roster,rules){const used=new Set();return units.map(u=>{const h=roster.find(h=>h.id===u.heroId),range=h.tiers?.find(t=>t.star===u.star)?.range??h.range,rows=range<=c.meleeRange?c.meleeRows:c.rangedRows;
 const slot=rows.flatMap(row=>Array.from({length:rules.columns},(_,col)=>row*rules.columns+col)).find(s=>s<rules.rows*rules.columns&&!used.has(s));used.add(slot);return {...u,slot};});}
/** 仅估算已实现的额外专属技能，未落地的设计文案不虚增战力。 */
function score(units,roster,rules,equipment){const power=require('./combat-power').power,base=power(units,roster,rules,equipment),q=require('./qinggang-config'),march=require('./chitu-config');let bonus=0;
 for(const u of units){const ids=new Set(equipment.filter(e=>e.owner===u.uid).map(e=>e.id));
  if(ids.has(q.id)&&require('./equipment-exclusive').active(q.id,u.heroId)){const s=require('./expedition-stats').stats(u,units,roster,equipment,rules);bonus+=power([u],roster,rules,equipment)*(Math.sqrt(1+q.hits*q.power*s.interval/q.cooldown)-1);}
 }
 const marchActive=units.some(u=>equipment.some(e=>e.owner===u.uid&&e.id===march.id)&&require('./equipment-exclusive').active(march.id,u.heroId));
 return (base+bonus)*(marchActive?Math.sqrt(1+march.haste*Math.min(1,march.duration/march.period)):1);
}
/** 在真实物品及每人槽位限制内分配装备，迭代改善归属；同一实例只计一次。 */
function equip(units,items,roster,rules){let equipment=[];let value=score(units,roster,rules,equipment);
 for(let pass=0;pass<c.equipmentPasses;pass++)for(const item of items){const rest=equipment.filter(e=>e.uid!==item.uid);let best=equipment,bestValue=value;
  for(const u of units){const owned=rest.filter(e=>e.owner===u.uid),options=owned.length>=policy.equipmentLimit?owned.map(old=>rest.filter(e=>e.uid!==old.uid)):[rest];
   for(const option of options){const candidate=option.concat({...item,owner:u.uid}),next=score(units,roster,rules,candidate);
   if(next>bestValue+c.improvementEpsilon){best=candidate;bestValue=next;}}}
  equipment=best;value=bestValue;
 }
 return {units,equipment,power:value};
}
/** 无装备的束搜索保留羁绊组合，再对有限最终候选进行合法配装优化。 */
function search(pool,items,roster,rules,limit){if(pool.length<=limit)return equip(formation(pool,roster,rules),items,roster,rules);let beam=[{units:[],power:0}];
 for(let size=0;size<limit;size++){const candidates=new Map();for(const prior of beam)for(const u of pool){if(prior.units.some(v=>v.uid===u.uid))continue;
  const units=formation(prior.units.concat(u).sort((a,b)=>String(a.uid).localeCompare(String(b.uid))),roster,rules),key=units.map(v=>v.uid).join(':');if(candidates.has(key))continue;
  candidates.set(key,{units,power:score(units,roster,rules,[])});}
  beam=[...candidates.values()].sort((a,b)=>b.power-a.power).slice(0,c.beamWidth);
 }
 // 保留装备适配候选，避免裸装评分漏选持有专属装备的武将。
 const equippedPool=pool.map(u=>{const result=equip(formation([u],roster,rules),items,roster,rules);return {u,power:result.power};}).sort((a,b)=>b.power-a.power);
 const gearTeam=formation(equippedPool.slice(0,limit).map(x=>x.u),roster,rules);
 const finalists=beam.slice(0,c.finalists).concat({units:gearTeam});
 let best={units:[],equipment:[],power:0};for(const candidate of finalists){const next=equip(candidate.units,items,roster,rules);if(next.power>best.power)best=next;}
 return best;
}
/** 人口内的最强静态估算阵容；缓存忽略部署和装备归属，移动到场下不会降低结果。 */
function query(state,rules,roster=require('./expedition-roster'),combatRules=context(state,rules),options={}){
 const population=require('./population').limit(state,rules),pool=state.units.filter(u=>roster.some(h=>h.id===u.heroId)).map(({slot,retryStats,...u})=>u).sort((a,b)=>String(a.uid).localeCompare(String(b.uid))),seen=new Set();
 const items=(options.includeEquipment===false?[]:(state.expedition?.equipment||[])).filter(e=>{if(seen.has(e.uid)||!policy.equipment.some(v=>v.id===e.id))return false;seen.add(e.uid);return true;}).map(({owner,...e})=>e).sort((a,b)=>String(a.uid).localeCompare(String(b.uid)));
 const key=JSON.stringify([c.version,population,pool,items,combatRules]),entries=cache.get(state)||[],hit=entries.find(e=>e.key===key&&e.roster===roster);if(hit)return hit.value;
 const result=search(pool,items,roster,require('./stat-evaluation-cache').create(combatRules),Math.min(population,pool.length)),highest=Math.max(1,...pool.map(u=>u.star));
 const value={...result,population,highest,highestCount:Math.min(population,pool.filter(u=>u.star===highest).length)};entries.unshift({key,roster,value});entries.length=Math.min(entries.length,c.cacheEntries);cache.set(state,entries);return value;
}
module.exports={query,context,score};
