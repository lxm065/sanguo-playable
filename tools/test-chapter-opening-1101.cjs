'use strict';
const test=require('node:test'),a=require('node:assert/strict'),rules=require('../game/play/config'),roster=require('../game/play/expedition-roster'),{Expedition}=require('../game/play/expedition'),budget=require('../game/play/enemy-budget');
/** 生成当前章节首战内存档，三枚一级许褚保持真实开局结构。 */
function fixture(chapter){const m=new Expedition(rules,roster,{read:()=>null,write(){}});require('../game/play/classic-hooks').attach(m,roster);Object.assign(m.state.meta,{chapter,section:1,cleared:chapter-1});const n=m.progression.nodes().find(n=>n.row===0&&n.type==='battle');Object.assign(m.state.meta,{activeNode:n.id,layer:n.row,route:{key:chapter+'-1',nodes:[]}});m.state.units=[1,2,3].map(uid=>({uid,heroId:'xuchu',star:1,slot:-1}));m.state.nextUid=4;return m;}
/** 验证人数、等级、装备同时符合固定首战规则。 */
function check(units){a.equal(units.length,1);a.equal(units[0].star,1);a.equal((units[0].equipment||[]).length,0);}
test('全部60章三条开局路线，三合一前后均固定单个裸装一级敌人',()=>{
 for(let chapter=1;chapter<=60;chapter++){const m=fixture(chapter);for(const node of m.progression.nodes().filter(n=>n.row===0&&n.type==='battle')){m.state.meta.activeNode=node.id;const before=m.enemies();check(before);a.deepEqual(m.enemies(),before);}m.merge(1);check(m.enemies());}
});
test('第二章旧缓存预览只读，开战迁移为单敌人，已有战报不重写',()=>{
 const m=fixture(2),wrong=Array.from({length:4},(_,i)=>({uid:-i-1,heroId:'xuchu',star:3,slot:i,equipment:[{uid:'old'+i,id:'7001',owner:-i-1}]}));
 m.state.expedition.enemyEncounter={key:budget.key(m.state),units:wrong,retries:0,scale:1,levelPolicyVersion:2};const raw=JSON.stringify(m.state);check(m.enemies());a.equal(JSON.stringify(m.state),raw);m.merge(1);m.state.units[0].slot=0;const battle=m.fight();check(battle.initial.filter(u=>u.side==='enemy'));check(m.state.expedition.enemyEncounter.units);
 const pending={...m.state,pending:{battle:{}}};a.equal(require('../game/play/tutorial-enemy').apply(wrong,pending),wrong);
});
test('首节后续战斗及其他小节不误判为每章第一关',()=>{const m=fixture(2);for(const n of m.progression.nodes().filter(n=>n.row>0)){m.state.meta.activeNode=n.id;a.equal(require('../game/play/tutorial-enemy').first(m.state),false);}m.state.meta.section=2;const n=m.progression.nodes().find(n=>n.row===0);m.state.meta.activeNode=n.id;a.equal(require('../game/play/tutorial-enemy').first(m.state),false);});
