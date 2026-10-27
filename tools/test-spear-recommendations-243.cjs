'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const view=require('../game/play/equipment-recommendation-view'),exclusive=require('../game/play/equipment-exclusive');
test('虎头湛金枪在场上及备战席恢复近战推荐，专属仍只属于马超',()=>{
 const units=[{uid:1,heroId:'machao',slot:0},{uid:2,heroId:'guanyu',slot:1},{uid:3,heroId:'xuchu',slot:-1},{uid:4,heroId:'huangzhong',slot:2},{uid:5,heroId:'zhouyu',slot:-1}];
 assert.deepEqual(view.targets({id:'7007'},units,[]),[{uid:1,recommended:true,exclusive:true},{uid:2,recommended:true,exclusive:false},{uid:3,recommended:true,exclusive:false}]);
 assert.equal(exclusive.active('7007','machao'),true);
 for(const hero of ['guanyu','xuchu'])assert.equal(exclusive.active('7007',hero),false);
 assert.equal(exclusive.weaponOwner('7007'),'马超');
});
test('放开普通推荐不影响其他专属兵器既有推荐策略',()=>{
 const {heroIds}=require('../game/play/equipment-recommendations');
 assert(heroIds('7005').includes('zhangfei'));assert(heroIds('7005').includes('guanyu'));
 assert(heroIds('7101').includes('zhenji'));assert(heroIds('7101').includes('xiaoqiao'));
});
