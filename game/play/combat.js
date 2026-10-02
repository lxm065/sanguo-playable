'use strict';
/** 可重放的随机数源；随机状态由战役存档持有。 */
function random(seed){let value=seed>>>0;return ()=>{value=(value+0x6D2B79F5)>>>0;let t=value;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};}
/** 曼哈顿距离决定射程、寻敌和移动，不依赖绘制坐标。 */
function distance(a,b){return Math.abs(a.x-b.x)+Math.abs(a.y-b.y);}
/** 从阵容生成可变战斗副本，绝不将战斗血量写回持久武将。 */
function combatants(units,side,roster,rules,enemyScale=1){
 return units.map(unit=>{
  const hero=roster.find(h=>h.id===unit.heroId),sameRole=units.filter(u=>roster.find(h=>h.id===u.heroId).role===hero.role).length;
  const synergy=sameRole>=rules.synergyThreshold?1+rules.synergyAttackBonus:1;
  const hp=Math.round(hero.hp*Math.pow(rules.hpGrowth,unit.star-1)*(side==='enemy'?enemyScale:1));
  return {...unit,...hero,uid:unit.uid,heroId:unit.heroId,side,star:unit.star,hp,maxHp:hp,
   attack:hero.attack*Math.pow(rules.attackGrowth,unit.star-1)*(side==='enemy'?enemyScale:synergy),
   x:unit.slot%rules.columns,y:Math.floor(unit.slot/rules.columns)+(side==='enemy'?rules.rows:0),
   nextAction:0,attacks:0,stunnedUntil:0};
 });
}
/** 搜索到射程边界的最短空格路径；已占用格子不能穿越或重叠。 */
function nextStep(actor,target,units,rules){
 const occupied=new Set(units.filter(u=>u.hp>0&&u!==actor).map(u=>u.x+','+u.y));
 const queue=[{x:actor.x,y:actor.y,first:null}],seen=new Set([actor.x+','+actor.y]);
 while(queue.length){
  const p=queue.shift();if(p.first&&distance(p,target)<=actor.range)return p.first;
  const neighbors=[{x:p.x,y:p.y+(actor.side==='ally'?1:-1)},{x:p.x-1,y:p.y},{x:p.x+1,y:p.y},{x:p.x,y:p.y+(actor.side==='ally'?-1:1)}];
  neighbors.sort((a,b)=>distance(a,target)-distance(b,target));
  for(const n of neighbors){const key=n.x+','+n.y;if(n.x<0||n.x>=rules.columns||n.y<0||n.y>=rules.rows*2||seen.has(key)||occupied.has(key))continue;seen.add(key);queue.push({...n,first:p.first||n});}
 }
 return null;
}
/** 按固定时步计算移动、攻击前摇、技能与死亡，输出有序的表现事件。 */
function simulate(allies,enemies,roster,rules,seed,enemyScale){
 const units=[...combatants(allies,'ally',roster,rules),...combatants(enemies,'enemy',roster,rules,enemyScale)];
 const initial=JSON.parse(JSON.stringify(units)),events=[],hits=[],rng=random(seed);
 let elapsed=0,result='draw';
 for(let step=0;step<=Math.ceil(rules.maxBattleSeconds/rules.tickSeconds);step++){
  const t=+(step*rules.tickSeconds).toFixed(4);elapsed=t;
  // 同一时间的已发出攻击仍可命中，避免阵列遍历顺序取消对方已完成的出手。
  for(let i=0;i<hits.length;){const hit=hits[i];if(hit.at>t){i++;continue;}hits.splice(i,1);const target=units.find(u=>u.uid===hit.target);if(target.hp<=0)continue;
   target.hp=Math.max(0,target.hp-hit.damage);if(hit.stun)target.stunnedUntil=Math.max(target.stunnedUntil,t+hit.stun);
   events.push({type:'damage',t,actor:hit.actor,target:target.uid,damage:hit.damage,hp:target.hp,critical:hit.critical,skill:hit.skill,stun:hit.stun});
   if(target.hp===0)events.push({type:'death',t,uid:target.uid});
  }
  const allyAlive=units.some(u=>u.side==='ally'&&u.hp>0),enemyAlive=units.some(u=>u.side==='enemy'&&u.hp>0);
  if(!allyAlive||!enemyAlive){result=allyAlive?'win':enemyAlive?'loss':'draw';break;}
  for(const actor of units){
   if(actor.hp<=0||actor.nextAction>t||actor.stunnedUntil>t)continue;
   const targets=units.filter(u=>u.side!==actor.side&&u.hp>0).sort((a,b)=>distance(actor,a)-distance(actor,b)||a.hp-b.hp||a.uid-b.uid);
   const target=targets[0];
   if(distance(actor,target)>actor.range){const next=nextStep(actor,target,units,rules);if(next){actor.x=next.x;actor.y=next.y;events.push({type:'move',t,uid:actor.uid,x:next.x,y:next.y,duration:rules.moveSeconds});}actor.nextAction=t+rules.moveSeconds;continue;}
   actor.attacks++;const skill=actor.attacks%actor.skillEvery===0;actor.nextAction=t+actor.interval;
   events.push({type:'attack',t,uid:actor.uid,target:target.uid,skill,skillName:skill?actor.skillName:'',ranged:actor.range>1});
   const affected=skill&&actor.skill==='cleave'?targets.filter(u=>distance(u,target)<=1):[target];
   for(const victim of affected){const critical=rng()<rules.criticalChance;
    const damage=Math.max(rules.minDamage,Math.round(actor.attack*(skill?actor.skillPower:1)*rules.armorScale/(rules.armorScale+victim.armor)*(critical?rules.criticalMultiplier:1)));
    hits.push({at:t+rules.attackDelay,actor:actor.uid,target:victim.uid,damage,critical,skill,stun:skill&&actor.skill==='stun'?actor.stunSeconds:0});
   }
  }
 }
 return {initial,events,result,duration:elapsed,final:units.map(u=>({uid:u.uid,hp:u.hp,x:u.x,y:u.y}))};
}
module.exports={random,simulate,distance,combatants,nextStep};
