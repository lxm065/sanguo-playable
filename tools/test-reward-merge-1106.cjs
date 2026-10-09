'use strict';
const test=require('node:test'),a=require('node:assert/strict'),{available}=require('../game/play/reward-merge-hint');
test('奖励领取凑齐同名同阶才提示，跨阶与最高阶不误报',()=>{const m={state:{units:[{heroId:'xuchu',star:1,slot:0},{heroId:'xuchu',star:1,slot:-1}]},rules:{mergeCount:3},maxRank:()=>4};a.equal(available(m,'xuchu',1),true);a.equal(available(m,'zhenji',1),false);a.equal(available(m,'xuchu',2),false);m.state.units.forEach(u=>u.star=4);a.equal(available(m,'xuchu',4),false);m.state.units.pop();a.equal(available(m,'xuchu',1),false);});
