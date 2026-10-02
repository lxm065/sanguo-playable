"use strict";
const { call } = require("./devtool.cjs");
/** 独立内存验收场景；通过 restore 校验玩家数据并恢复真实页面。 */
const actions = {
  setup:
    "const original={model:sample.model,progress:sample.model.progression,state:JSON.stringify(sample.model.state)};sample.expeditionOriginal=original;\nconst E=GameGlobal[0].require('play/expedition.js').Expedition;\nconst testModel=new E(config,roster,{read:()=>null,write:()=>{}});\nGameGlobal[0].require('play/classic-hooks.js').attach(testModel,roster);\ntestModel.simulator=(a,e,r,c,s,k)=>GameGlobal[0].require('play/expedition-combat.js').simulate(a,e,r,c,s,k,testModel.state.expedition.equipment);\nview.model=testModel;view.progress=testModel.progression;sample.qaModel=testModel;\nview.page='battle';testModel.progression.enter('0-1');view.render();view.mergePanel(1);\nreturn {isolated:true,state:testModel.state.units};\n",
  step: "const m=sample.qaModel;m.deploy(1,2);view.render();return {units:m.state.units};\n",
  inspect:
    "return {units:sample.qaModel.state.units,progress:sample.qaModel.state.meta,expedition:sample.qaModel.state.expedition,pending:sample.qaModel.state.pending?.rewardKind,originalUnchanged:JSON.stringify(sample.model.state)===sample.expeditionOriginal.state};",
  details:
    "const m=sample.qaModel;const guan=m.state.units.find(u=>u.heroId==='guanyu');m.equip(m.state.expedition.equipment[0].uid,guan.uid);view.details(guan.heroId,guan.uid);return {units:m.state.units,gear:m.state.expedition.equipment};\n",
  "three-slots":
    "const m=sample.qaModel,guardian=m.state.units.find(u=>u.heroId==='guanyu');m.transact(()=>{for(const id of ['7206','7213']){const uid=m.addEquipment(id);m.equip(uid,guardian.uid);}});view.details(guardian.heroId,guardian.uid);return {equipment:m.state.expedition.equipment};\n",
  directed:
    "const m=sample.qaModel;m.transact(()=>m.state.units.push({uid:m.state.nextUid++,heroId:'xuchu',star:2,slot:-1}));view.render();view.mergePanel(1);return {targets:m.directedTargets(1)};\n",
  battle:
    "const m=sample.qaModel;view.page='battle';view.render();return {state:m.state.units};\n",
  status:
    "return {playing:view.playing,page:view.page,pending:sample.qaModel.state.pending&&{kind:sample.qaModel.state.pending.rewardKind,result:sample.qaModel.state.pending.battle.result,duration:sample.qaModel.state.pending.battle.duration},ready:sample.ready};\n",
  elite:
    "const m=sample.qaModel;const node=m.progression.nodes().find(n=>n.type==='elite');m.transact(()=>{m.state.meta.layer=node.row;m.state.meta.activeNode=node.id;const guan=m.state.units.find(u=>u.heroId==='guanyu');if(guan)guan.slot=3;});view.page='battle';view.render();return {isolated:true,node:node.id};",
  restore:
    "const original=sample.expeditionOriginal;if(JSON.stringify(sample.model.state)!==original.state)throw Error('原存档状态已变化，请先核对');if(view.timer)clearInterval(view.timer);view.playing=false;view.model=original.model;view.progress=original.progress;view.page='home';view.render();return {restored:true,originalUnchanged:true};",
};
/** 只接受列出的验收步骤，禁止将参数作为任意代码拼接。 */
function main() {
  const source = actions[process.argv[2]];
  if (!source) throw Error("可选步骤：" + Object.keys(actions).join(", "));
  console.log(
    JSON.stringify(
      call("automation_evaluate", {
        "fn-source":
          "function(){const sample=GameGlobal[0].__sanguoPlay;const {cc,model,view,config,roster}=sample;" +
          source +
          "}",
      }),
      null,
      2,
    ),
  );
}
main();
