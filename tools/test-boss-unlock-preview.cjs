'use strict';
const test=require('node:test'),a=require('node:assert/strict'),{Expedition}=require('../game/play/expedition'),{attach}=require('../game/play/classic-hooks'),roster=require('../game/play/expedition-roster'),rules=require('../game/play/config'),{needed}=require('../game/play/boss-unlock-preview');
/** 真实获取池覆盖章节开放与BOSS奖励两种路径，不改动存档。 */
test('马超通关第四章后隐藏重复提示，回玩时仍隐藏',()=>{const m=new Expedition(rules,roster,{read:()=>null,write:()=>{}});attach(m,roster);m.state.meta.cleared=3;a(needed(m,{boss:'machao'}));m.state.meta.cleared=4;for(const chapter of [1,7]){m.state.meta.chapter=chapter;const before=JSON.stringify(m.state);a.equal(needed(m,{boss:'machao'}),false);a.equal(JSON.stringify(m.state),before);}});
/** 显式解锁与已持有记录同样抑制提示，未获得的BOSS仍提示。 */
test('BOSS奖励与当前持有兼容旧档',()=>{const m=new Expedition(rules,roster,{read:()=>null,write:()=>{}});attach(m,roster);const t={boss:'zhangfei',unlock:'zhangfei'};a(needed(m,t));m.state.meta.unlocked.push('zhangfei');a.equal(needed(m,t),false);m.state.units.push({uid:99,heroId:'machao',star:1,slot:-1});a.equal(needed(m,{boss:'machao'}),false);});
