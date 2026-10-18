'use strict';
const c=require('./battle-panel-warm-config');
/** 仅预备当前页手牌和上阵单位，限制模型数量，避免大量手牌触发整库装配。 */
function mergeModels(model,benchPage=0){
 const ids=require('./merge-hints').eligible(model),seen=new Set(),units=model.state.units,size=model.rules.layout.benchPageSize,bench=units.filter(u=>u.slot<0),page=Math.max(0,Math.min(benchPage,Math.max(0,Math.ceil(bench.length/size)-1)));
 const visible=[...bench.slice(page*size,(page+1)*size),...units.filter(u=>u.slot>=0)],result=[];
 for(const u of visible){if(!ids.has(u.uid))continue;const key=require('./appearance-policy').resolve(require('./battle-appearance'),u.heroId,u.star+1).assetKey;if(seen.has(key))continue;seen.add(key);result.push({id:u.heroId,star:u.star+1});if(result.length>=c.maxMergeModels)break;}
 return result;
}
/** 按帧预备属性快照和合成外观；换页、开战或事务变更后丢弃过期任务。 */
function schedule(view,enemies,timer=setTimeout,cancel=clearTimeout){
 cancel(view.panelWarmTimer);const model=view.model,state=model.state,revision=model.revision||0,benchPage=view.benchPage||0;
 const valid=()=>view.model===model&&model.state===state&&(model.revision||0)===revision&&(view.benchPage||0)===benchPage&&view.page==='battle'&&!view.playing&&!state.pending;
 const tasks=[()=>require('./unit-details').prepared(model,enemies),...c.images.map(file=>()=>view.assets.sprite(file)),...mergeModels(model,view.benchPage||0).map(u=>()=>view.assets.skeleton(u.id,u.star))];
 let first=true;
 const next=()=>{view.panelWarmTimer=timer(async()=>{if(!valid())return;const task=tasks.shift();try{await task();}catch(error){console.warn('战场面板预备失败，可点击重试',error);}if(tasks.length&&valid())next();},first?c.delay:c.stepDelay);first=false;};
 next();
}
module.exports={schedule,mergeModels};
