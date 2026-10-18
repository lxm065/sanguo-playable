'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const config=require('./route-failure-audit.config.json'),base='../game/play/',req=id=>require(base+id);
const rules={...req('config'),maxStar:5},roster=req('expedition-roster'),combat=req('expedition-combat'),budget=req('enemy-budget'),light=req('enemy-light-balance'),cycle=req('enemy-difficulty-cycle');
/** 在固定图上计算完整连通路线，按整条路线精英数最少/最多选择；同分保持中路优先。 */
function route(graph,kind){
 const best=new Map();
 for(const node of [...graph.nodes].sort((a,b)=>b.row-a.row)){
  const options=graph.edges.filter(e=>e[0]===node.id).map(e=>best.get(e[1])).filter(Boolean);
  options.sort((a,b)=>(kind==='seekElite'?b.score-a.score:a.score-b.score)||Math.abs(a.nodes[0].lane-1)-Math.abs(b.nodes[0].lane-1)||a.nodes[0].lane-b.nodes[0].lane);
  const next=options[0];best.set(node.id,{score:(node.type==='elite'?1:0)+(next?.score||0),nodes:[node,...(next?.nodes||[])]});
 }
 const result=best.get(graph.nodes.find(n=>n.row===0).id).nodes;
 assert.equal(result.at(-1).type,'boss');for(let i=1;i<result.length;i++)assert(graph.edges.some(e=>e[0]===result[i-1].id&&e[1]===result[i].id));return result;
}
/** 所有状态仅驻留内存；阶段阵容来自公开假设，不读取玩家存档、不使用广告接口。 */
function create(chapter,seed){
 const m=new(req('expedition').Expedition)(rules,roster,{read:()=>null,write(){}});req('classic-hooks').attach(m,roster);
 Object.assign(m.state.meta,{chapter,cleared:chapter-1,hp:999});m.state.seed=seed;return m;
}
/** 各阶段使用相同可复现成长模板，统一近战前排远程后排，装备按固定配置逐人分配。 */
function stage(m,section,profile){
 Object.assign(m.state.meta,{section,activeNode:null,layer:0,route:{key:m.state.meta.chapter+'-'+section,nodes:[]},mapVersion:req('route-graph').readyVersion()});
 delete m.state.expedition.enemyEncounter;
 const stars=config.stages[section-1];m.state.expedition.level=1;while(m.limit()<stars.length)m.state.expedition.level++;
 const units=stars.map((star,i)=>({uid:i+1,heroId:config.heroes[i],star,slot:-1}));
 m.state.units=req('strongest-team').query({...m.state,units},rules,roster,req('player-combat-context').snapshot(m.state,rules),{includeEquipment:false}).units;
 assert.equal(m.state.units.length,stars.length);m.state.nextUid=stars.length+1;
 m.state.expedition.equipment=m.state.units.flatMap(u=>profile.items.map((id,j)=>({id,uid:`${u.uid}:${j}`,owner:u.uid})));
 m.state.meta.equipmentGrades=Object.fromEntries(profile.items.map(id=>[id,profile.grade]));
 const graph=req('branch-route').generate(m.state.meta);m.state.meta.branchRoutes={...m.state.meta.branchRoutes,[m.state.meta.route.key]:graph};return graph;
}
/** 调用游戏原生敌军生成、战斗和胜败难度循环；奖励经济/事件收益由固定成长模板替代。 */
function run(chapter,profile,routeKind,seed,graphs,observe=null){
 const m=create(chapter,seed),records=[];let blocked=false;
 for(let section=1;section<=config.stages.length&&!blocked;section++){
  const graph=stage(m,section,profile);graphs[`${chapter}-${section}`]=graph;
  for(const node of route(graph,routeKind)){
   Object.assign(m.state.meta,{activeNode:node.id,layer:node.row});
   const record={chapter,section,node:node.id,row:node.row,type:node.type,profile:profile.id,route:routeKind,seed,attempts:[],reliefs:0};records.push(record);
   if(['battle','elite','boss'].includes(node.type)){
    budget.lock(m);light.apply(m);const e=m.state.expedition.enemyEncounter,combatRules=req('player-combat-context').rules(m);
    record.levels=e.units.map(u=>u.star);record.ownLevels=m.state.units.map(u=>u.star);record.beforeDifficulty=cycle.current(m.state)?.difficulty??null;
    for(let attempt=0;attempt<=config.maxReliefs;attempt++){
     // 每次尝试使用预先确定的独立种子；算法确定且可重跑，不采样未来结果来选择路径。
     const battleSeed=(seed+chapter*100003+section*1009+node.row*97+attempt*17)>>>0;
     const result=combat.simulate(m.state.units,m.enemies(),roster,combatRules,battleSeed,req('chapter-difficulty').scale(m.state,rules),m.state.expedition.equipment);
     if(observe)observe(m,record,result,battleSeed);
     record.attempts.push({result:result.result,duration:result.duration,scale:e.scale,curve:e.lightBalance?.curve??null,seed:battleSeed});
     if(result.result==='win'){
      cycle.settle(m,{battle:result});req('enemy-opening-progress').settle(m,{battle:result});record.passed=true;break;
     }
     cycle.settle(m,{battle:result});
     if(attempt===config.maxReliefs){record.passed=false;blocked=true;break;}
     budget.assist(m,true);record.reliefs++;
    }
   }
   m.state.meta.route.nodes.push(node.id);if(blocked)break;
  }
 }
 return {chapter,profile:profile.id,route:routeKind,seed,blocked,records};
}
/** 保存全部原始尝试和源码指纹，保证图上标记能够追溯至真实模拟结果。 */
function main(){
 const selected=process.argv.find(v=>v.startsWith('--chapters='))?.split('=')[1];const start=Date.now(),out=path.resolve(config.output+(selected?'-'+selected.replaceAll(',','-'):''));fs.mkdirSync(out,{recursive:true});
 const graphs={},runs=[],chapters=selected?selected.split(',').map(Number):process.argv.includes('--pilot')?[config.chapters[0]]:config.chapters;
 for(const chapter of chapters){for(const profile of config.profiles)for(const kind of config.routes)for(const seed of config.seeds)runs.push(run(chapter,profile,kind,seed,graphs));console.log(JSON.stringify({chapter,runs:runs.length,ms:Date.now()-start}));}
 // 未抵达的后续阶段仍展示固定地图，并明确标为未模拟，不能当成通过。
 for(const chapter of chapters)for(let section=1;section<=5;section++)graphs[`${chapter}-${section}`]??=req('branch-route').generate({chapter,section});
 const hash=crypto.createHash('sha256');for(const file of fs.readdirSync('game/play').filter(f=>f.endsWith('.js')).sort())hash.update(file).update(fs.readFileSync('game/play/'+file));
 const data={version:req('app-version').version,createdAt:new Date().toISOString(),sourceHash:hash.digest('hex'),config:{...config,chapters},elapsedMs:Date.now()-start,graphs,runs};
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(data));console.log(JSON.stringify({out,elapsedMs:data.elapsedMs,runs:runs.length,battles:runs.flatMap(r=>r.records).filter(r=>r.attempts.length).length,attempts:runs.flatMap(r=>r.records).reduce((n,r)=>n+r.attempts.length,0),blocked:runs.filter(r=>r.blocked).length}));
}
if(require.main===module)main();
module.exports={run};
