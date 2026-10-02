"use strict";
const { call } = require("./devtool.cjs");
/** 本轮模拟器验收全部在内存夹具执行，真实玩家存档只读并在恢复时比较。 */
const steps = {
  setup: `sample.refineOriginal={model:sample.model,progress:sample.model.progression,state:JSON.stringify(sample.model.state)};const E=GameGlobal[0].require('play/expedition.js').Expedition;const m=new E(config,roster,{read:()=>null,write:()=>{}});GameGlobal[0].require('play/classic-hooks.js').attach(m,roster);m.simulator=(a,e,r,c,s,k)=>GameGlobal[0].require('play/expedition-combat.js').simulate(a,e,r,c,s,k,m.state.expedition.equipment);sample.refineModel=m;view.model=m;view.progress=m.progression;m.progression.enter('0-1');view.page='battle';view.render();return {units:m.state.units,population:m.limit()};`,
  enemy: `const unit=view.model.enemies()[0];const p=view.position(unit.slot%config.columns,Math.floor(unit.slot/config.columns)+config.rows);return {uid:unit.uid,x:172+p.x*344/720,y:371.5-(p.y+40)*344/720};`,
  four: `const m=sample.refineModel;m.transact(()=>{m.state.units[0].heroId='xiaoqiao';m.state.units[0].star=4;});view.render();view.details('xiaoqiao',1);return {page:'four-skills'};`,
  battle: `const m=sample.refineModel;m.transact(()=>{m.state.units=['xuchu','huangzhong','zhenji'].map((id,i)=>({uid:i+1,heroId:id,star:roster.find(h=>h.id===id).tier,slot:[2,0,4][i]}));m.state.nextUid=4;});m.enemies=()=>[{uid:-1,heroId:'xuchu',star:2,slot:2},{uid:-2,heroId:'xiahouyuan',star:2,slot:1},{uid:-3,heroId:'guanyu',star:3,slot:4}];view.page='battle';view.render();return {units:m.state.units};`,
  inspect: `const labels=[];const visit=n=>{const l=n.getComponent(cc.Label);if(l)labels.push(l.string);n.children.forEach(visit);};if(view.modal?.isValid)visit(view.modal);return {playing:view.playing,labels,actors:[...view.actors.entries()].map(([id,a])=>({id,model:!!a.sp.skeletonData,animation:a.sp.animation,facing:a.facing,position:{x:a.node.position.x,y:a.node.position.y},alpha:a.sp.premultipliedAlpha})),unchanged:JSON.stringify(sample.model.state)===sample.refineOriginal.state};`,
  models: `const ids=Object.keys(GameGlobal[0].require('play/battle-appearance.js').models);return Promise.all(ids.map(async id=>{const data=await sample.assets.skeleton(id);return {id,loaded:!!data.getRuntimeData(),actions:Object.keys(data.skeletonJson.animations).length};}));`,
  restore: `if(view.timer)clearInterval(view.timer);view.timer=null;view.playing=false;if(JSON.stringify(sample.model.state)!==sample.refineOriginal.state)throw Error('真实存档发生变化');view.model=sample.refineOriginal.model;view.progress=sample.refineOriginal.progress;view.page='home';view.render();return {restored:true,unchanged:true};`,
};
/** 只执行受控命名步骤，不将命令行文本拼成任意游戏代码。 */
function main() {
  const code = steps[process.argv[2]];
  if (!code) throw Error(Object.keys(steps).join("/"));
  console.log(
    JSON.stringify(
      call("automation_evaluate", {
        "fn-source":
          "function(){const sample=GameGlobal[0].__sanguoPlay;const {cc,view,config,roster}=sample;" +
          code +
          "}",
      }),
      null,
      2,
    ),
  );
}
main();
