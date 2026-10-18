'use strict';
const test=require('node:test'),a=require('node:assert/strict'),{Expedition}=require('../game/play/expedition'),roster=require('../game/play/expedition-roster'),rules=require('../game/play/config'),{unitDetails}=require('../game/play/unit-details');
/** 隔离存档并统计真实敌阵查询，避免依赖不稳定的毫秒阈值。 */
function fixture(){const m=new Expedition(rules,roster,{read:()=>null,write(){}});require('../game/play/classic-hooks').attach(m,roster);m.deploy(m.state.units[0].uid,0);let calls=0;const original=m.enemies.bind(m);m.enemies=()=>{calls++;return original();};return {m,calls:()=>calls};}
test('连续查看不同英雄只准备一次属性，成功事务后失效',()=>{const f=fixture(),m=f.m,u=m.state.units[0];unitDetails(m,u.heroId,u.uid);unitDetails(m,u.heroId,u.uid);unitDetails(m,roster[0].id,-1);a.equal(f.calls(),1);m.transact(()=>{m.state.gold++;});unitDetails(m,u.heroId,u.uid);a.equal(f.calls(),2);});
test('回放快照直接显示，不生成敌军，保留阶级和属性',()=>{const f=fixture(),snapshot={uid:-1,heroId:roster[0].id,star:4,hp:987,attack:123,skills:[]};f.m.enemies=()=>{throw Error('回放不可重新生成敌军');};const result=unitDetails(f.m,snapshot.heroId,-1,snapshot);a.equal(result.unit.star,4);a.equal(result.value,snapshot);});
test('失败事务回滚后不复用过时对象，查询不改变存档',()=>{const f=fixture(),m=f.m,u=m.state.units[0];unitDetails(m,u.heroId,u.uid);const before=JSON.stringify(m.state);a.throws(()=>m.transact(()=>{m.state.gold++;throw Error('取消');}));unitDetails(m,u.heroId,u.uid);a.equal(f.calls(),2);a.equal(JSON.stringify(m.state),before);});

test('预备复用已展示敌阵，首次属性点击不再重复生成敌军，事务后重算',()=>{
 const f=fixture(),m=f.m,u=m.state.units[0],enemies=m.enemies();const before=JSON.stringify(m.state);
 require('../game/play/unit-details').prepared(m,enemies);unitDetails(m,u.heroId,u.uid);a.equal(f.calls(),1);a.equal(JSON.stringify(m.state),before);
 m.transact(()=>{m.state.gold++;});unitDetails(m,u.heroId,u.uid);a.equal(f.calls(),2);
});
test('离开备战后丢弃预备任务；合成下一阶按真实外观去重且不修改存档',async()=>{
 const f=fixture(),m=f.m,queue=[],calls=[],v={model:m,page:'battle',playing:false,assets:{sprite:async file=>calls.push(file),skeleton:async(id,star)=>calls.push([id,star])}};
 const warm=require('../game/play/battle-panel-warm');const source=m.state.units[0];m.state.units.push({...source,uid:91,slot:-1},{...source,uid:92,slot:-1});const before=JSON.stringify(m.state);
 warm.schedule(v,[],fn=>{queue.push(fn);return queue.length;},()=>{});v.page='map';await queue.shift()();a.equal(calls.length,0);a.equal(f.calls(),0);
 v.page='battle';warm.schedule(v,m.enemies(),fn=>{queue.push(fn);return queue.length;},()=>{});while(queue.length)await queue.shift()();
 const u=m.state.units[0];unitDetails(m,u.heroId,u.uid);a.equal(f.calls(),1);a.equal(JSON.stringify(m.state),before);
 const candidates=warm.mergeModels(m);a(candidates.length>0);a(candidates.every(x=>x.star>1));a.deepEqual(calls.filter(Array.isArray),candidates.map(x=>[x.id,x.star]));
});
test('属性页装备蓝紫框复用图鉴颜色，保留装备详情触摸',()=>{
 const f=fixture(),m=f.m,u=m.state.units[0],entries=require('../game/play/equipment-catalog-data'),ids=[2,3].map(q=>entries.find(e=>e.quality===q).id);m.state.expedition.equipment=ids.map((id,i)=>({id,uid:i+1,owner:u.uid}));
 const boxes=[],images=[];const node=()=>({addComponent:()=>({}),on(){},getChildByName:()=>node()});
 const ui={box:(...args)=>{boxes.push(args);return node();},image:(...args)=>{images.push(args);return node();},text:()=>({}),node};
 require('../game/play/unit-details').showUnitDetails({model:m,ui,cc:{BlockInputEvents:class{},Node:{EventType:{TOUCH_END:'end'}},Label:{HorizontalAlign:{LEFT:0}}},overlay:node,paper:node},u.heroId,u.uid,{name:'武将',skills:[],range:2,attack:10,hp:100});
 const slots=boxes.filter(x=>String(x[1]).startsWith('property-equipment-'));a.deepEqual(slots.slice(0,2).map(x=>x[6]),ids.map(id=>require('../game/play/equipment-icon').color(id)));a(slots.slice(0,2).every(x=>x[7]===false));a.equal(images.filter(x=>String(x[1]).startsWith('equipment/')).length,2);
});

test('大量手牌只预备可见页与上阵武将，数量封顶且翻页后旧任务退出',async()=>{
 const {m}=fixture(),warm=require('../game/play/battle-panel-warm'),limit=require('../game/play/battle-panel-warm-config').maxMergeModels;
 m.state.units=[];for(let i=0;i<300;i++)m.state.units.push({uid:i+1,heroId:roster[Math.floor(i/6)%roster.length].id,star:1,slot:-1});
 let rankCalls=0;const original=m.maxRank.bind(m);m.maxRank=()=>{rankCalls++;return original();};const before=JSON.stringify(m.state),page=3,size=m.rules.layout.benchPageSize,visible=new Set(m.state.units.slice(page*size,(page+1)*size).map(u=>u.heroId)),planned=warm.mergeModels(m,page);
 a(planned.length>0&&planned.length<=limit);a(planned.every(u=>visible.has(u.id)));a.equal(rankCalls,1);a.equal(JSON.stringify(m.state),before);
 const queue=[],calls=[],v={model:m,benchPage:page,page:'battle',playing:false,assets:{sprite:async()=>calls.push('sprite'),skeleton:async()=>calls.push('model')}};warm.schedule(v,[],fn=>{queue.push(fn);return queue.length;},()=>{});v.benchPage++;await queue.shift()();a.equal(calls.length,0);
});
