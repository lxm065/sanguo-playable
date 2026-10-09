'use strict';
const test=require('node:test'),a=require('node:assert/strict'),fs=require('node:fs');
const {Expedition}=require('../game/play/expedition'),{attach}=require('../game/play/classic-hooks'),roster=require('../game/play/expedition-roster'),policy=require('../game/play/expedition-config'),rules={...require('../game/play/config'),maxStar:5,startingRoster:policy.initialRoster};
const catalog=require('../game/play/equipment-catalog'),upgrade=require('../game/play/equipment-upgrades'),config=require('../game/play/equipment-upgrade-config'),{stats}=require('../game/play/expedition-stats'),{prepareBattle}=require('../game/play/expedition-combat');
/** 独立内存存档，不接触当前开发工具中的玩家数据。 */
function fixture(saved=null){let stored=saved,fail=false;const storage={read:()=>stored,write:s=>{if(fail)throw Error('写入失败');stored=structuredClone(s);}};const model=new Expedition(rules,roster,storage);attach(model,roster);return {model,saved:()=>structuredClone(stored),fail:()=>{fail=true;}};}
/** 准备可消费材料，通过模型事务保留存档验证。 */
function fund(model,id){model.transact(()=>{model.state.meta.cleared=60;model.state.meta.diamonds=100000;model.state.meta.inventory[id]=10000;});}
test('完整38件按14/10/14分组，13开放25待开放；查询不改存档',()=>{
 const {model:m}=fixture(),before=JSON.stringify(m.state),groups=catalog.groups(m.state),items=groups.flatMap(g=>g.items);
 a.deepEqual(groups.map(g=>g.items.length),[14,10,14]);a.equal(items.filter(e=>e.active).length,38);a.equal(new Set(items.map(e=>e.id)).size,38);a.equal(new Set(items.map(e=>e.name)).size,38);
 for(const item of items){a(fs.existsSync('game/skin-assets/equipment/'+item.id+'.png'));a(item.attributes.length);a(item.effects.length);a(!item.effects.join('').includes('<'));if(!item.active)a.equal(item.canUpgrade,false);}
 a.equal(JSON.stringify(m.state),before);a.throws(()=>catalog.query('invalid'));
});
test('13件逐阶扣费至10阶并可恢复，过期双击与满阶拒绝',()=>{
 for(const definition of policy.equipment){const f=fixture(),m=f.model;fund(m,definition.id);
  for(let level=0;level<10;level++){const q=catalog.query(definition.id,m.state),before={diamonds:m.state.meta.diamonds,fragments:m.state.meta.inventory[definition.id]};a(q.canUpgrade);a.equal(upgrade.upgrade(m,definition.id,level,m.adTicket()),level+1);a.equal(m.state.meta.diamonds,before.diamonds-config.diamondCosts[level]);a.equal(m.state.meta.inventory[definition.id],before.fragments-config.fragmentCosts[level]);const snapshot=JSON.stringify(m.state);a.throws(()=>upgrade.upgrade(m,definition.id,level),/变化/);a.equal(JSON.stringify(m.state),snapshot);}
  a.equal(catalog.query(definition.id,m.state).max,true);a.throws(()=>upgrade.upgrade(m,definition.id,10),/满阶/);a.equal(fixture(f.saved()).model.state.meta.equipmentGrades[definition.id],10);
 }
});
test('不足、章节未通、未开放、待结算和写盘失败均不吞材料',()=>{
 const f=fixture(),m=f.model;m.state.meta.cleared=1;
 for(const [id,pattern]of [['7201',/3/],['7202',/碎片/],['7003',/3/]]){const before=JSON.stringify(m.state);a.throws(()=>upgrade.upgrade(m,id,0),pattern);a.equal(JSON.stringify(m.state),before);}
 m.transact(()=>{m.state.meta.inventory['7202']=5;});a.throws(()=>upgrade.upgrade(m,'7202',0),/钻石/);
 fund(m,'7202');m.deploy(m.state.units[0].uid,0);m.fight(true);const pending=JSON.stringify(m.state);a.throws(()=>upgrade.upgrade(m,'7202',0),/结算/);a.equal(JSON.stringify(m.state),pending);m.claim();
 const before=JSON.stringify(m.state),saved=f.saved();f.fail();a.throws(()=>upgrade.upgrade(m,'7202',0),/写入失败/);a.equal(JSON.stringify(m.state),before);a.deepEqual(f.saved(),saved);
});
test('每一阶配置的强化都能改变对应装备的实际面板，敌人不继承玩家强化',()=>{
 const units=[{uid:1,heroId:'xuchu',star:1,slot:0},{uid:2,heroId:'zhenji',star:1,slot:1}],enemy=[{uid:-1,heroId:'xuchu',star:1,slot:0}];
 for(const definition of policy.equipment){const id=definition.id,equipment=[{uid:1,id,owner:1},{uid:2,id,owner:2}];
  for(let level=1;level<=10;level++){const before=units.map(u=>stats(u,units,roster,equipment,{...rules,playerEquipmentGrades:{[id]:level-1}})),after=units.map(u=>stats(u,units,roster,equipment,{...rules,playerEquipmentGrades:{[id]:level}}));a.notDeepEqual(after,before,id+'第'+level+'阶');for(const value of after){a(Number.isFinite(value.hp)&&value.hp>0);a(Number.isFinite(value.attack));a(value.interval>0);}}
  const normal=prepareBattle(units,enemy,roster,rules,1,equipment),boosted=prepareBattle(units,enemy,roster,{...rules,playerEquipmentGrades:{[id]:10}},1,equipment);a.deepEqual(boosted.find(u=>u.uid===-1),normal.find(u=>u.uid===-1));
 }
});
test('同名共享阶级，未穿戴不生效，旧档零阶属性不重复计算百分比',()=>{
 const unit={uid:1,heroId:'xuchu',star:1,slot:0},idle=[{uid:1,id:'7202',owner:null}],plain=stats(unit,[unit],roster,idle,rules);
 a.deepEqual(stats(unit,[unit],roster,idle,{...rules,playerEquipmentGrades:{'7202':10}}),plain);
 const heart=stats(unit,[unit],roster,[{uid:1,id:'7212',owner:1}],rules);const hero=roster.find(h=>h.id===unit.heroId).tiers.find(t=>t.star===1);a.equal(heart.hp,Math.round((hero.hp+1800)*1.15));
 a(upgrade.valid(undefined));for(const grades of [null,[],{'7202':-1},{'7202':11},{'7202':.5},{'unknown':1}])a.equal(upgrade.valid(grades),false);
});
test('说明完整换行，三国名称统一且战斗定义不会被强化查询修改',()=>{
 const view=require('../game/play/equipment-catalog-view'),theme=require('../game/play/equipment-theme'),before=JSON.stringify(policy.equipment);
 for(const group of catalog.groups({}))for(const item of group.items)for(const value of [...item.attributes,...item.effects,item.flavor])a.equal(view.wrap(value,500,25).join(''),value.replace(/\n/g,''));
 for(const item of policy.equipment){a.equal(item.name,theme[item.id].name);upgrade.resolve(item,{[item.id]:10});a.equal(upgrade.lines(item.id).length,10);}
 a.equal(JSON.stringify(policy.equipment),before);
});
