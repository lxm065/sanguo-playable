'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),skill=require('../game/play/qinggang-skill'),c=require('../game/play/qinggang-config'),protection=require('../game/play/combat-protection');
const rules={...require('../game/play/config'),overtime:{enabled:false},maxBattleSeconds:4};
/** 构造不访问玩家存档的独立技能测试单位。 */
function actor(extra={}){return {uid:1,heroId:c.hero,hp:1000,side:'ally',x:0,y:0,cooldownFactor:1,equipmentRuntime:[{id:c.id}],...extra};}
/** 收集完整七段的时序，模拟结算后的目标变化。 */
function run(enemies,onHit=()=>{}){const a=actor(),units=[a,...enemies],events=[],hits=[],targets=[];assert(skill.activate(a,units,0,events));for(let n=0;n<30;n++){skill.tick(a,units,n/10,hits,events,rules,()=>targets.length%2*.6);while(hits.length){const h=hits.shift();targets.push(h.u.uid);onHit(h);}}return {a,events,targets};}
test('七次随机攻击，独立位移，不与存活单位重叠，结束清除无敌',()=>{const enemies=[{uid:2,hp:1000,side:'enemy',x:1,y:4},{uid:3,hp:1000,side:'enemy',x:4,y:4}];const r=run(enemies);assert.equal(r.targets.length,7);assert.equal(new Set(r.targets).size,2);assert.equal(r.events.filter(e=>e.type==='move').length,7);for(const e of r.events.filter(e=>e.type==='move'))assert(!enemies.some(u=>u.x===e.x&&u.y===e.y));assert(!protection.protectedUnit(r.a));});
test('单敌可连续攻击七次，击杀目标后重新随机选活人，全部死亡提前结束',()=>{assert.equal(run([{uid:2,hp:100,side:'enemy',x:1,y:4}]).targets.length,7);const r=run([{uid:2,hp:100,side:'enemy',x:1,y:4},{uid:3,hp:100,side:'enemy',x:4,y:4}],h=>h.u.hp=0);assert.deepEqual(r.targets,[2,3]);assert(!r.a.qinggangCast);});
test('资格、重复装备、沉默、冷却和无目标门禁',()=>{const e={uid:2,hp:100,side:'enemy',x:1,y:4};for(const extra of [{heroId:'guanyu'},{equipmentRuntime:[]},{silencedUntil:2},{stunnedUntil:2}])assert(!skill.activate(actor(extra),[e],0,[]));assert(!skill.activate(actor(),[],0,[]));const a=actor({equipmentRuntime:[{id:c.id},{id:c.id}]});assert(skill.activate(a,[e],0,[]));assert(!skill.activate(a,[e],0,[]));delete a.qinggangCast;assert(!skill.activate(a,[e],1,[]));assert(skill.activate(a,[e],c.cooldown,[]));});
test('战斗集成：七次物理伤害，无敌期间不受持续伤害和反伤，结束恢复受伤，可重放',()=>{
 const roster=require('../game/play/expedition-roster').map(h=>({...h,tiers:(h.tiers||[]).map(t=>({...t,hp:100000,attack:100,armor:0,magicArmor:0}))}));
 const allies=[{uid:1,heroId:'zhaoyun',star:1,slot:0}],enemies=[{uid:2,heroId:'zhangfei',star:3,slot:0},{uid:3,heroId:'xuchu',star:2,slot:1,reflect:.5}],equipment=[{id:c.id,uid:10,owner:1}];
 const sim=require('../game/play/expedition-combat').simulate,b=sim(allies,enemies,roster,rules,42,1,equipment);
 assert.deepEqual(b,sim(allies,enemies,roster,rules,42,1,equipment));
 const slashes=b.events.filter(e=>e.type==='damage'&&e.effect===c.effect);assert.equal(slashes.length,7);assert(slashes.every(e=>e.damageType==='physical'));
 const end=b.events.filter(e=>e.type==='move'&&e.effect===c.effect).at(-1).t+c.interval;
 assert(!b.events.some(e=>e.type==='damage'&&e.target===1&&e.t<end));assert(b.events.some(e=>e.type==='damage'&&e.target===1&&e.t>=end));
 assert(!b.events.some(e=>['attack','ability'].includes(e.type)&&e.uid!==1&&e.target===1&&e.t<end));
 assert.equal(require('../game/play/equipment-exclusive').skill(c.id).implemented,true);
});

test('已出手攻击在七进七出期间落点命中时被拦截',()=>{
 const old=c.initialCooldown;c.initialCooldown=.3;
 try{
  const roster=require('../game/play/expedition-roster'),sim=require('../game/play/expedition-combat').simulate;
  const b=sim([{uid:1,heroId:'zhaoyun',star:1,slot:0,hp:100000,range:10,interval:.3}],[{uid:2,heroId:'zhaoyun',star:1,slot:0,hp:100000,range:10,interval:.3}],roster,{...rules,attackDelay:.4},3,1,[{id:c.id,uid:10,owner:1}]);
  const start=b.events.find(e=>e.type==='move'&&e.effect===c.effect).t,end=b.events.filter(e=>e.type==='move'&&e.effect===c.effect).at(-1).t+c.interval;
  assert(b.events.some(e=>e.type==='attack'&&e.uid===2&&e.t<start&&e.t+.4>=start));
  assert(!b.events.some(e=>e.type==='damage'&&e.target===1&&e.t>=start&&e.t<end));
 }finally{c.initialCooldown=old;}
});
