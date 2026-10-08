'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{PlayView}=require('../game/play/view');
/** 使用真实攻击事件入口，验证挑战配置禁止普攻/技能覆盖回合对阵信息。 */
test('多人对战攻击后保留对阵标题，不出现两军交战',()=>{const status={string:'第1回合 · 对阵测试'},v={config:require('../game/play/challenge-config'),status,actors:new Map([[1,{}]]),ui:{animate(){}},cc:{}};PlayView.prototype.apply.call(v,{type:'attack',uid:1});assert.equal(status.string,'第1回合 · 对阵测试');PlayView.prototype.apply.call(v,{type:'attack',uid:1,skill:true,skillName:'测试技能'});assert.equal(status.string,'第1回合 · 对阵测试');});
