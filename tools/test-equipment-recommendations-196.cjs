'use strict';
const test=require('node:test'),a=require('node:assert/strict'),{heroIds}=require('../game/play/equipment-recommendations'),roster=require('../game/play/expedition-roster'),config=require('../game/play/equipment-recommendation-config');
test('战戟护臂与近战溅射装备不再推荐远程，虎贲包含许褚',()=>{
 for(const id of ['7003','7007']){
  a(heroIds(id).includes('xuchu'));a(heroIds(id).includes('guanyu'));
  for(const h of roster.filter(h=>h.range>1))a(!heroIds(id).includes(h.id),id+':'+h.id);
 }
});
test('主要攻击属性与推荐武将的实际伤害类型匹配，法术先锋及猛将不遗漏',()=>{
 for(const id of ['7001','7004','7007','7009','7208'])for(const h of heroIds(id))a(require('../game/play/hero-damage').accepts(roster.find(r=>r.id===h),false));
 for(const id of ['7103','7113']){a(heroIds(id).includes('zhaoyun'));a(heroIds(id).includes('zhangfei'));a(heroIds(id).includes('zhangjiao'));}
 a.deepEqual(heroIds('7004'),['xuchu']);a.deepEqual(heroIds('7002'),['dianwei']);
});
test('全部38件有明确策略和理由，新增同类武将自动匹配且未知装备不虚报',()=>{
 const items=require('../game/play/equipment-catalog-data');a.equal(items.length,38);
 a.deepEqual(Object.keys(config.items).sort(),items.map(e=>e.id).sort());
 for(const e of items){a(config.items[e.id].reason);a(config.profiles[config.items[e.id].profile]);a(heroIds(e.id).length);}
 const extended=[...roster,{id:'new-archer',role:'神射',magic:false,range:3},{id:'new-melee',role:'猛将',magic:false,range:1}];
 a(!heroIds('7006',extended).includes('new-archer'));a(heroIds('7007',extended).includes('new-melee'));a(!heroIds('7007',extended).includes('new-archer'));a.deepEqual(heroIds('unknown'),[]);
});
