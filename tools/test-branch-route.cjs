'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),branch=require('../game/play/branch-route'),graph=require('../game/play/route-graph');
test('60章5节单普通起点、2至3分叉、特殊节点10至14、无孤立节点且唯一终点',()=>{const counts=new Set();for(let chapter=1;chapter<=60;chapter++)for(let section=1;section<=5;section++){const s={chapter,section,layer:0};branch.initialize(s);const b=branch.current(s),start=b.nodes.filter(n=>n.row===0),boss=b.nodes.filter(n=>n.type==='boss');assert.equal(start.length,1);assert.equal(start[0].type,'battle');assert.equal(boss.length,1);const first=b.edges.filter(e=>e[0]===start[0].id);assert(first.length>=2&&first.length<=3);const specials=b.nodes.filter(n=>['elite','merchant','spring','treasure'].includes(n.type));assert(specials.length>=10&&specials.length<=14);counts.add(specials.length);for(const n of b.nodes){const out=b.edges.filter(e=>e[0]===n.id);if(n.type==='boss')assert.equal(out.length,0);else assert(out.length>=1&&out.length<=3);if(n.row)assert(b.edges.some(e=>e[1]===n.id));for(const e of out){const to=b.nodes.find(n=>n.id===e[1]);assert.equal(to.row,n.row+1);assert(graph.connected({row:n.row,lane:n.lane},to,s));}}const saved=JSON.stringify(b);branch.initialize(s);assert.equal(JSON.stringify(branch.current(s)),saved);assert.deepEqual(graph.nodes(s,{}),b.nodes);}assert.equal(counts.size,5);});
test('已有进行中路线不替换，下个小节启用新图，存档往返和重开不重抽',()=>{const s={chapter:2,section:2,layer:3,activeNode:'3-1'};assert.equal(branch.initialize(s),false);s.section++;s.layer=0;s.activeNode=null;branch.initialize(s);const old=JSON.stringify(branch.current(s));const loaded=JSON.parse(JSON.stringify(s));branch.initialize(loaded);assert.equal(JSON.stringify(branch.current(loaded)),old);});

test('真实进度入口沿随机分支完成一节，失败不横移，通关后新节仍为普通单起点',()=>{for(let choice=0;choice<3;choice++){const {Expedition}=require('../game/play/expedition'),roster=require('../game/play/expedition-roster'),m=new Expedition(require('../game/play/config'),roster,{read:()=>null,write(){}}),p=require('../game/play/classic-hooks').attach(m,roster);for(let row=0,last=p.nodes().find(n=>n.type==='boss').row;row<=last;row++){const available=p.nodes().filter(n=>p.accessible(n));assert(available.length);const n=available[choice%available.length];p.enter(n.id);if(['battle','elite','boss'].includes(n.type)){if(n.type!=='boss'){p.settle({battle:{result:'loss'}});p.state.hp=3;assert.deepEqual(p.nodes().filter(n=>p.accessible(n)).map(n=>n.id),available.map(n=>n.id));p.enter(n.id);}p.settle({battle:{result:'win'}});}else if(n.type==='merchant')m.nodeEvents.leave();else if(n.type==='treasure')m.nodeEvents.treasure(0);else if(n.type==='spring')m.nodeEvents.spring('equipment');}assert.equal(p.state.section,2);assert.equal(p.nodes().filter(n=>n.row===0).length,1);assert.equal(p.nodes().find(n=>n.row===0).type,'battle');}});

test('所有可行路线经过4至6个特殊节点，中途没有全线汇合，所有特殊类型均出现',()=>{
 const types=require('../game/play/branch-route-config').specialTypes;
 for(let chapter=1;chapter<=60;chapter++)for(let section=1;section<=5;section++){
  const b=branch.generate({chapter,section}),ranges=new Map(),last=Math.max(...b.nodes.map(n=>n.row));
  for(let row=1;row<last;row++)assert([2,3].includes(b.nodes.filter(n=>n.row===row).length));
  for(const type of types)assert(b.nodes.some(n=>n.type===type));
  for(const n of b.nodes){
   const parents=b.edges.filter(e=>e[1]===n.id).map(e=>ranges.get(e[0])),cost=types.includes(n.type)?1:0;
   ranges.set(n.id,parents.length?[Math.min(...parents.map(p=>p[0]))+cost,Math.max(...parents.map(p=>p[1]))+cost]:[cost,cost]);
  }
  const [min,max]=ranges.get(b.nodes.find(n=>n.type==='boss').id);assert(min>=4,`${chapter}-${section}: ${min}`);assert(max<=6,`${chapter}-${section}: ${max}`);
  assert.equal(b.specialCount,b.nodes.filter(n=>types.includes(n.type)).length);
 }
});

test('椭圆轮廓两端收窄，中间连续三路',()=>{
 for(let chapter=1;chapter<=60;chapter++)for(let section=1;section<=5;section++){
  const b=branch.generate({chapter,section}),last=Math.max(...b.nodes.map(n=>n.row));
  const at=row=>b.nodes.filter(n=>n.row===row),span=row=>Math.max(...at(row).map(n=>n.x))-Math.min(...at(row).map(n=>n.x));
  assert.equal(at(0)[0].x,0);assert.equal(at(last)[0].x,0);
  assert.equal(at(1).length,2);assert.equal(at(last-1).length,2);
  for(let row=3;row<=last-3;row++)assert.equal(at(row).length,3);
  assert(span(1)<span(3));assert(span(last-1)<span(last-3));assert(span(3)<span(Math.floor(last/2)));
  assert(b.edges.some(([a,z])=>a.split('-')[1]!==z.split('-')[1]&&Number(a.split('-')[0])>2&&Number(z.split('-')[0])<last-2));
 }
});

test('60章5节无X交叉，新图连线左右顺序一致且绘制不交错层高',()=>{
 const planar=require('../game/play/route-planar'),view=require('../game/play/route-view');
 for(let chapter=1;chapter<=60;chapter++)for(let section=1;section<=5;section++){
  const b=branch.generate({chapter,section}),nodes=new Map(b.nodes.map(n=>[n.id,n]));
  for(const a of b.edges)for(const z of b.edges)assert(!planar.crosses(a,z,nodes));
  for(let row=1;row<b.nodes.at(-1).row;row++)assert.equal(new Set(b.nodes.filter(n=>n.row===row).map(n=>view.position(n).y)).size,1);
 }
});
test('旧图消除X时保留走过路线和当前选项，不改变奖励，保存后不再迁移',()=>{
 const planar=require('../game/play/route-planar');for(let chapter=1;chapter<=20;chapter++)for(let row=1;row<12;row++){
  const s={chapter,section:1,layer:row+1,lane:0},b=branch.generate(s);b.version=3;
  const a=b.nodes.filter(n=>n.row===row),z=b.nodes.filter(n=>n.row===row+1);
  const chosen=[a[0].id,z.at(-1).id],cross=[a.at(-1).id,z[0].id];b.edges.push(chosen,cross);s.route={key:chapter+'-1',nodes:[a[0].id]};s.branchRoutes={[s.route.key]:b};
  const options=b.edges.filter(e=>e[0]===a[0].id).map(e=>e[1]).sort(),before=b.nodes.map(n=>[n.id,n.type]);branch.migrate(s);const next=branch.current(s),nodes=new Map(next.nodes.map(n=>[n.id,n]));
  assert.deepEqual(next.nodes.map(n=>[n.id,n.type]),before);for(const option of options)assert(next.edges.some(e=>e[0]===a[0].id&&e[1]===option));
  for(const e of next.edges)for(const f of next.edges)assert(!planar.crosses(e,f,nodes));
  for(const n of next.nodes){if(n.row)assert(next.edges.some(e=>e[1]===n.id));if(n.type!=='boss')assert(next.edges.some(e=>e[0]===n.id));}
  assert(!branch.needsMigration(s));const saved=JSON.stringify(s);branch.migrate(s);assert.equal(JSON.stringify(s),saved);
 }
});

/** 构造旧规则九个特殊层的快照，用于验证真实遗留地图而非新版模拟。 */
function oldNine(s){const b=branch.generate(s);b.version=4;for(const n of b.nodes)if(n.row>0&&n.row<=9)n.type='merchant';return b;}
test('未开始旧图九个特殊层自动替换，其他旧小节清理，资产和奖励记录保留',()=>{
 const s={chapter:1,section:1,layer:0,diamonds:123,inventory:{potion:9},claimed:['a'],branchRoutes:{}};s.branchRoutes['1-1']=oldNine(s);s.branchRoutes['1-2']=oldNine(s);
 branch.initialize(s);assert.deepEqual(branch.current(s),branch.generate(s));assert(!s.branchRoutes['1-2']);assert.equal(s.diamonds,123);assert.deepEqual(s.inventory,{potion:9});assert.deepEqual(s.claimed,['a']);assert(!branch.needsMigration(s));
});
test('进行中九特殊层旧图不改节点奖励，反复加载不迁移，重开才换统一新图',()=>{
 const s={chapter:1,section:1,layer:2,lane:0,activeNode:'2-0',route:{key:'1-1',nodes:['0-1','1-0']},branchRoutes:{}};s.branchRoutes['1-1']=oldNine(s);const types=s.branchRoutes['1-1'].nodes.map(n=>n.type);
 branch.initialize(s);assert.deepEqual(branch.current(s).nodes.map(n=>n.type),types);assert.equal(s.activeNode,'2-0');assert(!branch.needsMigration(s));const saved=JSON.stringify(s);branch.initialize(s);assert.equal(JSON.stringify(s),saved);
 s.layer=0;s.activeNode=null;s.route=null;assert(branch.needsMigration(s));branch.initialize(s);assert.deepEqual(branch.current(s),branch.generate(s));
});
test('旧图通关进入下一节，删除旧图并生成统一新节地图',()=>{
 const s={chapter:1,section:1,layer:10,branchRoutes:{}};s.branchRoutes['1-1']=oldNine(s);branch.initialize(s);s.section=2;s.layer=0;branch.initialize(s);assert(!s.branchRoutes['1-1']);assert.deepEqual(branch.current(s),branch.generate(s));
});
test('真实加载入口替换未开始的旧图，不清除玩家货币与存档',()=>{
 const {Expedition}=require('../game/play/expedition'),roster=require('../game/play/expedition-roster'),config=require('../game/play/config'),hooks=require('../game/play/classic-hooks');
 const m=new Expedition(config,roster,{read:()=>null,write(){}}),p=hooks.attach(m,roster);p.state.branchRoutes['1-1']=oldNine(p.state);p.state.diamonds=12345;const raw=JSON.stringify(m.state);
 const loaded=new Expedition(config,roster,{read:()=>JSON.parse(raw),write(){}}),next=hooks.attach(loaded,roster);assert.equal(next.state.diamonds,12345);assert.deepEqual(branch.current(next.state),branch.generate(next.state));
});


test('60章5节每条完整路线含BOSS共14至15节点，固定章节点数一致且两种长度均出现',()=>{
 const counts=new Set();for(let chapter=1;chapter<=60;chapter++)for(let section=1;section<=5;section++){
  const b=branch.generate({chapter,section}),ranges=new Map();
  for(const n of b.nodes){const parents=b.edges.filter(e=>e[1]===n.id).map(e=>ranges.get(e[0]));ranges.set(n.id,parents.length?[1+Math.min(...parents.map(p=>p[0])),1+Math.max(...parents.map(p=>p[1]))]:[1,1]);}
  const [min,max]=ranges.get(b.nodes.find(n=>n.type==='boss').id);assert(min>=14&&max<=15);counts.add(max);assert.deepEqual(b,branch.generate({chapter,section}));
 }assert.deepEqual([...counts].sort(),[14,15]);
});
