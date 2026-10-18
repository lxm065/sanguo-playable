'use strict';
const c=require('./branch-route-config'),route=require('./route-config');
/** 返回当前章、节快照键。 */
function key(s){return s.chapter+'-'+s.section;}
/** 两端各保留短肩部，中间持续展开三路，避免随机宽度造成反复收缩。 */
function rowWidth(row,last){return row<=c.shape.taperRows||row>=last-c.shape.taperRows?c.shape.shoulderBranches:c.shape.centerBranches;}
/** 用椭圆截面缩放横坐标，使起终点附近收窄、中段最宽。 */
function nodeX(row,lane,last,integer){const t=row/last,scale=Math.sqrt(Math.max(0,1-Math.pow(2*t-1,2)))*c.shape.widthScale;return (route.laneX[lane]+integer(-c.shape.jitter,c.shape.jitter))*scale||0;}
/** 均匀分段安排必经特殊层，额外奖励最多占用两层，约束所有路线的预算。 */
function specialPlan(last,integer,shuffle){
 const widths=new Map(),mandatory=c.pathSpecialCount[0],middle=last-1;
 c.mandatoryWidths.forEach((width,i)=>{
  const first=1+Math.floor(i*middle/mandatory),end=Math.floor((i+1)*middle/mandatory);
  const candidates=Array.from({length:end-first+1},(_,j)=>first+j).filter(row=>rowWidth(row,last)===width);
  widths.set(candidates[integer(0,candidates.length-1)],width);
 });
 const total=integer(...c.specialCount),base=[...widths.values()].reduce((a,b)=>a+b,0);
 const extraRows=shuffle(Array.from({length:middle},(_,i)=>i+1).filter(row=>!widths.has(row))).slice(0,c.pathSpecialCount[1]-mandatory);
 return {widths,total,extraRows,extra:total-base};
}
/** 保留直行通道，补齐中间支线入口，再少量加入交叉选择，避免过早全线汇合。 */
function connect(previous,current,edges,rng,integer){
 const lookup=new Map([...previous,...current].map(n=>[n.id,n]));
 const add=(from,to)=>{const local=edges.filter(e=>lookup.has(e[0])&&lookup.has(e[1]));if(require('./route-planar').add(local,[from.id,to.id],lookup)&&!edges.some(e=>e[0]===from.id&&e[1]===to.id))edges.push([from.id,to.id]);};
 if(previous.length===1){current.forEach(to=>add(previous[0],to));return;}
 if(current.length===1){previous.forEach(from=>add(from,current[0]));return;}
 for(const from of previous){
  const same=current.find(to=>to.lane===from.lane);
  add(from,same||current[integer(0,current.length-1)]);
 }
 for(const to of current)if(!edges.some(e=>e[1]===to.id))add(previous[integer(0,previous.length-1)],to);
 for(const from of previous)if(rng()<c.crossChance){
  const options=current.filter(to=>to.lane!==from.lane&&Math.abs(to.lane-from.lane)===Math.min(...current.filter(n=>n.lane!==from.lane).map(n=>Math.abs(n.lane-from.lane))));
  if(options.length)add(from,options[integer(0,options.length-1)]);
 }
}
/** 生成多条持续分离的路线，普通起点与唯一 BOSS 之间始终保留两至三条支线。 */
function generate(s){
 const rng=require('./combat').random(c.seed+(s.chapter||1)*1009+(s.section||1)*97);
 const integer=(a,b)=>a+Math.floor(rng()*(b-a+1));
 const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=integer(0,i);[a[i],a[j]]=[a[j],a[i]];}return a;};
 const nodes=[],edges=[],last=integer(...c.pathNodeCount)-1,plan=specialPlan(last,integer,shuffle);let previous=[];
 for(let row=0;row<=last;row++){
  const count=row===0||row===last?1:rowWidth(row,last);
  const lanes=count===1?[c.startLane]:count===2?[0,2]:[0,1,2];
  const current=lanes.map(lane=>({id:row+'-'+lane,row,lane,planar:true,type:row===last?'boss':'battle',x:nodeX(row,lane,last,integer),y:row*route.spacing}));
  nodes.push(...current);if(previous.length)connect(previous,current,edges,rng,integer);previous=current;
 }
 const specials=nodes.filter(n=>plan.widths.has(n.row));
 specials.push(...shuffle(nodes.filter(n=>plan.extraRows.includes(n.row))).slice(0,plan.extra));
 shuffle(specials).forEach((n,i)=>{n.type=i<c.specialTypes.length?c.specialTypes[i]:c.specialTypes[integer(0,c.specialTypes.length-1)];});
 return {version:c.version,nodes,edges,specialCount:plan.total};
}
/** 已生成的小节保留快照；新小节生成一次，重新进入或重开不重抽。 */
function initialize(s){migrate(s);s.branchRoutes=s.branchRoutes||{};if(s.branchRoutes[key(s)])return true;const active=s.layer>0||s.activeNode||s.route?.key===key(s)&&s.route.nodes?.length;if(active)return false;s.branchRoutes[key(s)]=generate(s);return true;}
/** 只读获取快照，界面刷新不生成、不修改路线。 */
function current(s){if(s.mapVersion!==undefined&&s.mapVersion!==route.version)return null;return s.branchRoutes?.[key(s)]||null;}
/** 当前小节已开始时保留战果及事件，直到通关或主动重开再换图。 */
function inProgress(s){return !!(s.layer>0||s.activeNode||s.route?.key===key(s)&&s.route.nodes?.length);}
/** 旧快照只允许当前进行中的小节继续使用，其余删除后按统一种子重建。 */
function migrate(s){for(const [id,b] of Object.entries(s.branchRoutes||{})){
 if(b.version>=c.version)continue;
 if(id!==key(s)||!inProgress(s)){delete s.branchRoutes[id];continue;}
 if(b.migrationReviewed===c.version)continue;
 s.branchRoutes[id]={...require('./route-planar').repair(b,s),migrationReviewed:c.version};
}}
/** 已保留的进行中旧图不反复写盘；通关或重开后重新触发清理。 */
function needsMigration(s){return Object.entries(s.branchRoutes||{}).some(([id,b])=>(b.version||0)<c.version&&(id!==key(s)||!inProgress(s)||b.migrationReviewed!==c.version));}
module.exports={generate,initialize,current,migrate,needsMigration};
