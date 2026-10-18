'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{animate}=require('../game/play/model-animation');
/** 记录真实播放入口的时间缩放和完成回调，不依赖渲染引擎。 */
function actor(heroId,star=1){return {unit:{heroId,star},node:{isValid:true},alive:true,facing:'n',directional:false,manifest:{actions:{attack:{duration:1}}},sp:{skeletonData:{},setCompleteListener(fn){this.complete=fn;},setAnimation(){return {};}}};}
test('赵云各阶待机降至55%，战斗倍速按比例保留，反复待机不叠乘',()=>{for(const star of [1,3,5]){const a=actor('zhaoyun',star);animate(a,'idle',true);assert.equal(a.sp.timeScale,.55);animate(a,'idle',true);assert.equal(a.sp.timeScale,.55);animate(a,'idle',true,{speed:2});assert.equal(a.sp.timeScale,1.1);}});
test('赵云攻击移动技能不降速，动作结束只降低待机速度，其他武将不变',()=>{const a=actor('zhaoyun');animate(a,'attack',false,{speed:2,contactDelay:.25});assert.equal(a.sp.timeScale,4);a.sp.complete();assert.equal(a.sp.timeScale,1.1);for(const name of ['run','cast','death']){animate(a,name,false,{speed:2});assert.equal(a.sp.timeScale,2);}const other=actor('zhangfei');animate(other,'idle',true,{speed:2});assert.equal(other.sp.timeScale,2);});
