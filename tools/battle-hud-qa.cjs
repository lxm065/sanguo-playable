"use strict";
const { call } = require("./devtool.cjs");
/** 创建纯内存验收局，显示全部八类羁绊与可拖动装备，不写玩家存档。 */
const setup = `sample.hudOriginal={model:sample.model,progress:sample.model.progression,state:JSON.stringify(sample.model.state)};const E=GameGlobal[0].require('play/expedition.js').Expedition;const m=new E(config,roster,{read:()=>null,write:()=>{}});GameGlobal[0].require('play/classic-hooks.js').attach(m,roster);m.transact(()=>{m.state.expedition.level=5;m.state.units=['zhenji','xuchu','zhaoyun','taishici','yanliang','guanyu','xuchu'].map((id,i)=>({uid:i+1,heroId:id,star:roster.find(h=>h.id===id).tier,slot:i<6?[0,2,4,6,8,10][i]:-1}));m.state.nextUid=8;for(const id of ['7212','7206','7213','7208'])m.addEquipment(id);});sample.hudModel=m;view.model=m;view.progress=m.progression;view.page='battle';view.render();return {isolated:true,units:m.state.units};`;
/** 只执行命名步骤，保留真实触摸测试可用的页面和坐标。 */
function main() {
  const action = process.argv[2],
    steps = {
      setup,
      inspect: `return {equipment:sample.hudModel.state.expedition.equipment,modal:!!view.modal?.isValid,drag:!!view.battleHud.drag,recommended:view.battleHud.drag?.markers.length,originalUnchanged:JSON.stringify(sample.model.state)===sample.hudOriginal.state};`,
      restore: `if(JSON.stringify(sample.model.state)!==sample.hudOriginal.state)throw Error('玩家状态改变');view.model=sample.hudOriginal.model;view.progress=sample.hudOriginal.progress;view.page='home';view.render();return {restored:true,originalUnchanged:true};`,
    };
  if (!steps[action]) throw Error("可选步骤：setup / inspect / restore");
  console.log(
    JSON.stringify(
      call("automation_evaluate", {
        "fn-source":
          "function(){const sample=GameGlobal[0].__sanguoPlay;const {view,config,roster}=sample;" +
          steps[action] +
          "}",
      }),
      null,
      2,
    ),
  );
}
main();
