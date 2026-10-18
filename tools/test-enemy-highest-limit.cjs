'use strict';
const test=require('node:test'),a=require('node:assert/strict'),rules={...require('../game/play/config'),maxStar:5},roster=require('../game/play/expedition-roster');
const budget=require('../game/play/enemy-budget'),light=require('../game/play/enemy-light-balance'),cycle=require('../game/play/enemy-difficulty-cycle');
/** 使用截图等级分布创建隔离存档，最高阶放场下也必须计入。 */
function model(chapter=8,section=4,type='elite'){
 const m=new(require('../game/play/expedition').Expedition)(rules,roster,{read:()=>null,write(){}});require('../game/play/classic-hooks').attach(m,roster);
 Object.assign(m.state.meta,{chapter,section,cleared:chapter-1,hp:20});m.state.expedition.level=7;
 m.state.units=[4,4,4,3,3,3,3].map((star,i)=>({uid:i+1,heroId:'xuchu',star,slot:i<3?-1:i}));m.state.nextUid=8;
 const n=m.progression.nodes().filter(n=>n.type===type).at(-1);Object.assign(m.state.meta,{activeNode:n.id,layer:n.row});return m;
}
test('全章节后续阶段普通精英首领均不能突破最高阶人数，援军也受最终限制',()=>{
 for(let chapter=1;chapter<=60;chapter++)for(const section of [2,4,5])for(const type of ['battle','elite','boss']){
  const m=model(chapter,section,type),units=m.enemies();a(units.every(u=>u.star<=4));a(units.filter(u=>u.star===4).length<=(chapter<=3&&type!=='boss'?3:4),`${chapter}-${section}-${type}`);
 }
});
test('旧8个四级敌军修正为最多4个，保留身份站位装备与五次广告折扣，重复开战不反弹',()=>{
 const m=model();budget.lock(m);light.apply(m);const e=m.state.expedition.enemyEncounter;
 e.units=e.units.map((u,i)=>({...u,star:i<8?4:3}));e.stagePolicyVersion=9;
 for(let i=0;i<5;i++)light.assist(m,true);
 const scale=e.scale,difficulty=cycle.current(m.state).difficulty,shape=e.units.map(({star,...u})=>u);
 a.equal(require('../game/play/chapter-difficulty').scale(m.state,rules),scale);
 a(m.enemies().filter(u=>u.star===4).length<=4);
 budget.lock(m);light.apply(m);a.equal(e.scale,scale);a.equal(cycle.current(m.state).difficulty,difficulty);a.equal(cycle.current(m.state).videoReliefs,5);
 a.deepEqual(e.units.map(({star,...u})=>u),shape);a(e.units.filter(u=>u.star===4).length<=4);
 const before=JSON.stringify(e);budget.lock(m);light.apply(m);a.equal(JSON.stringify(e),before);
 light.assist(m,true);a(e.scale<scale);
});
test('全一级不生成零级，待领奖战报原样保留',()=>{
 const m=model();m.state.units=[{uid:1,heroId:'xuchu',star:1,slot:0}];const units=m.enemies();a(units.length<=2);a(units.every(u=>u.star===1));
 const original=Array.from({length:8},(_,i)=>({uid:-i-1,star:4}));m.state.pending={};a.equal(require('../game/play/enemy-highest-limit').apply(original,m.state,rules),original);
});

/** 旧阵容迁移只减最高阶名额，已领取广告减难与待领奖战报保持不变。 */
test('前三章普通精英旧四名最高阶降至三名，Boss与第四章保持四名',()=>{
 for(const chapter of [1,2,3,4])for(const type of ['battle','elite','boss']){
  const m=model(chapter,4,type);budget.lock(m);light.apply(m);const e=m.state.expedition.enemyEncounter;
  e.units=e.units.map((u,i)=>({...u,star:i<4?4:3}));e.stagePolicyVersion=10;
  light.assist(m,true);const scale=e.scale,records=JSON.stringify(cycle.current(m.state)),before=JSON.stringify(e.units);
  m.state.pending={battle:{}};budget.lock(m);a.equal(JSON.stringify(e.units),before);m.state.pending=null;
  budget.lock(m);light.apply(m);a.equal(e.units.filter(u=>u.star===4).length,chapter<=3&&type!=='boss'?3:4);
  a.equal(e.scale,scale);a.equal(JSON.stringify(cycle.current(m.state)),records);
  const saved=JSON.stringify(e);budget.lock(m);a.equal(JSON.stringify(e),saved);
 }
});
