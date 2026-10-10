'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),detail=require('../game/play/handbook-detail');
test('双卡左侧使用共享头像，右侧和单张最高阶保留模型',()=>{const calls=[],host={ui:{image:(...a)=>{calls.push(['image',...a]);return {};},actor:(...a)=>{calls.push(['actor',...a]);return {};},face:()=>{}}};for(const [index,count] of [[0,2],[1,2],[0,1]])detail.appearance(host,{},'zhenji',{star:index?4:1},index,count,500);assert.deepEqual(calls.map(c=>c[0]),['image','actor','actor']);assert.equal(calls[0][2],'handbook/zhenji.png');assert.equal(calls[1][2].star,4);});
