'use strict';
const test=require('node:test'),a=require('node:assert/strict'),view=require('../game/play/enemy-board-view');
test('胜利待领奖隐藏敌军，领奖后没有当前节点则不提前显示下一战敌阵',()=>{const state={meta:{activeNode:'0-1'},pending:{battle:{result:'win'}}};a.equal(view.showResult(state,{side:'enemy'}),false);a.equal(view.showResult(state,{side:'ally'}),true);a.equal(view.preview(state),false);state.pending=null;state.meta.activeNode=null;a.equal(view.preview(state),false);state.meta.activeNode='1-1';a.equal(view.preview(state),true);});
test('战败仍可展示原战果，非战斗事件不显示战斗敌阵',()=>{const state={meta:{activeNode:'0-1'},pending:{battle:{result:'loss'}}};a.equal(view.showResult(state,{side:'enemy'}),true);state.pending=null;state.meta.nodeEvent={kind:'merchant'};a.equal(view.preview(state),false);});
