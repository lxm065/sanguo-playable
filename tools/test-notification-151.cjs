'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{query}=require('../game/play/notification-view'),{Expedition}=require('../game/play/expedition'),{attach}=require('../game/play/classic-hooks'),roster=require('../game/play/expedition-roster');
/** 使用隔离存档检查提示链，避免修改玩家进度。 */
function fixture(){const model=new Expedition({...require('../game/play/config'),maxStar:5,startingRoster:require('../game/play/expedition-config').initialRoster},roster,{read:()=>null,write:()=>{}});attach(model,roster);return {model};}
test('未通章无羁绊红点，通章后图鉴与羁绊同时提示，装备不误亮',()=>{const v=fixture();assert.equal(query(v,'bonds'),false);v.model.state.meta.cleared=1;assert.equal(query(v,'bonds'),true);assert.equal(query(v,'catalog'),true);assert.equal(query(v,'equipment'),false);});
test('激活一项后继续提示，全部激活后消失，查询不改变存档',()=>{const v=fixture();v.model.state.meta.cleared=1;v.model.state.meta.activatedBonds=['dragon'];const before=JSON.stringify(v.model.state);assert.equal(query(v,'bonds'),true);assert.equal(JSON.stringify(v.model.state),before);v.model.state.meta.activatedBonds.push('vanguard');assert.equal(query(v,'bonds'),false);assert.equal(query(v,'catalog'),false);});
