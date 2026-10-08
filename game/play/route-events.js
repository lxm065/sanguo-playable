'use strict';
/** 每小节只抽一次并保存；保留当前/已走节点，普通开局也允许抽到事件。 */
function initialize(model,reset=false){const s=model.state.meta,key=s.chapter+'-'+s.section;if(!reset&&s.routeEvents?.key===key)return;const nodes=require('./route-graph').nodes(s,require('./classic-config')),rng=require('./combat').random(require('./route-variants-config').eventSeed+(s.routeEventSerial=(s.routeEventSerial||0)+1)),types={};for(const lane of [0,1,2]){const candidates=nodes.filter(n=>n.lane===lane&&n.type!=='boss'),future=candidates.filter(n=>n.row>=s.layer&&n.id!==s.activeNode),values=future.map(n=>n.type);for(let i=values.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[values[i],values[j]]=[values[j],values[i]];}candidates.forEach(n=>{types[n.id]=n.type;});future.forEach((n,i)=>{types[n.id]=values[i];});}s.routeEvents={key,types};}
/** 查询无副作用，刷新界面和重启游戏不会重新抽签。 */
function apply(state,nodes){if(state.routeEvents?.key===state.chapter+'-'+state.section)for(const n of nodes)if(n.type!=='boss'&&state.routeEvents.types[n.id])n.type=state.routeEvents.types[n.id];return nodes;}
module.exports={initialize,apply};
