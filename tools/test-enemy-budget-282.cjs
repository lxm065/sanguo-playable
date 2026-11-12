'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),budget=require('../game/play/enemy-mechanism-budget'),transition=require('../game/play/enemy-transition-budget'),rules=require('../game/play/config'),roster=require('../game/play/expedition-roster');
/** 创建无装备的真实武将，机制预算与实际阶级技能共用配置。 */
function unit(heroId,uid,star=3){return {heroId,uid,star,slot:Math.abs(uid)-1,equipment:[]};}
/** 创建跨关目标的最小状态，隔离于真实玩家存档。 */
function state(chapter=4){return {meta:{chapter,cleared:chapter-1,section:3},expedition:{difficultyCycle:{chapter,difficulty:2,lastClearedCurve:2}}};}
test('蜀回血与重复钩人治疗计入有界机制预算，查询纯读且不预演',()=>{
 const enemies=[unit('zhangfei',-1),unit('zhangfei',-2),unit('guanyu',-3),unit('guanyu',-4)],before=JSON.stringify(enemies),b=budget.query(enemies,roster,rules,[]);
 assert(b.regen>0&&b.skills>0);assert(b.factor>1&&b.factor<=1.55);assert.equal(JSON.stringify(enemies),before);
 const high=enemies.map(u=>({...u,star:4})),cost=budget.query(high,roster,rules,[]);assert(cost.factor<=1.55);
});
test('相同敌阵装备格挡增加预算，玩家养成不污染敌方估值',()=>{
 const enemies=[unit('xuchu',-1)],bare=budget.query(enemies,roster,rules,[]),item={uid:'e',id:'7206',owner:-1},equipped=budget.query(enemies,roster,rules,[item]);assert(equipped.block>bare.block);
 const changed=budget.query(enemies,roster,{...rules,playerEquipmentGrades:{'7206':99},playerVip:{data_7:1e6},playerTalentTree:{1001:99}},[item]);assert.deepEqual(changed,equipped);
});
test('普通换Boss总目标跳幅受限，归一化后仍是单一目标',()=>{
 for(const [chapter,limit]of [[3,2.5],[4,2.8]]){const s=state(chapter),r=transition.query(s,1.35,2.5);assert(Math.abs(r.curve-limit)<1e-9);assert(Math.abs(r.difficulty*1.35-r.curve)<1e-9);assert(r.transition.capped);}
});
test('首次取样、视频恢复、重玩和类型下降保持原目标，不把敌军抬高',()=>{
 const s=state();s.expedition.difficultyCycle.recoveryTarget=3;assert.equal(transition.query(s,1.35,2.5).curve,3.375);
 delete s.expedition.difficultyCycle.recoveryTarget;s.meta.cleared=4;assert.equal(transition.query(s,1.35,2.5).curve,3.375);
 s.meta.cleared=3;assert.equal(transition.query(s,1.05,1).curve,1.05);delete s.expedition.difficultyCycle.lastClearedCurve;assert.equal(transition.query(s,1.35,2.5).curve,3.375);
});
test('正式生成记录分项总预算，既有锁定敌阵不会因升级重算',()=>{
 const {Expedition}=require('../game/play/expedition'),m=new Expedition({...rules,maxStar:5},roster,{read:()=>null,write(){}});require('../game/play/classic-hooks').attach(m,roster);
 Object.assign(m.state.meta,{chapter:4,cleared:3,section:3});m.state.expedition.level=5;m.state.units=[4,4,3,2,2].map((star,i)=>({heroId:'xuchu',uid:i+1,star,slot:i}));
 const node=m.progression.nodes().find(n=>n.type==='boss');Object.assign(m.state.meta,{activeNode:node.id,layer:node.row});const lock=require('../game/play/enemy-budget'),light=require('../game/play/enemy-light-balance');lock.lock(m);light.apply(m);
 const e=m.state.expedition.enemyEncounter,b=e.lightBalance.budget;assert(Math.abs(b.units+b.equipment+b.mechanisms-b.total)<1e-8);assert.equal(b.total,e.lightBalance.enemy);
 const snapshot=JSON.stringify(e);m.state.units[0].star=5;light.apply(m);assert.equal(JSON.stringify(e),snapshot);
 delete e.lightBalance.budget;delete e.lightBalance.mechanism;const legacy=JSON.stringify(e);light.apply(m);assert.equal(JSON.stringify(e),legacy,'旧版本同版本锁定快照继续保留');
});
