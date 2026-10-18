'use strict';
/** 首次开战的异步预演只读原状态，遮罩防止并发改阵，失败不写存档。 */
async function start(view){if(view.calibrating||view.playing)return;const model=view.model,cal=require('./enemy-winrate'),old=model.state.expedition?.enemyEncounter,key=require('../../game/play/enemy-budget').key(model.state);if(cal.target(model.state)===null||(old?.key===key&&old.calibration))return view.act(()=>view.start(false));
 if(!model.state.units.some(u=>u.slot>=0))return view.notice('提示','请至少上阵一名武将');
 const before=JSON.stringify(model.state),shadow=Object.create(model);shadow.state=JSON.parse(before);require('../../game/play/enemy-budget').lock(shadow);
 view.calibrating=true;const ui=require('./enemy-winrate-config').ui,layout=model.rules.layout;const shade=view.ui.box(view.root,'battle-preparing',0,0,layout.width,layout.height,ui.shade,false);shade.addComponent(view.cc.BlockInputEvents);view.ui.text(shade,ui.label,0,0,ui.font,ui.ink,ui.width,ui.height);
 try{await cal.calibrateAsync(shadow,async()=>{await new Promise(resolve=>setTimeout(resolve,0));if(!shade.isValid)throw Error('整军已取消');});if(!shade.isValid)return;if(JSON.stringify(model.state)!==before)throw Error('阵容已更新，请重新开战');shade.destroy();view.act(()=>model.transact(()=>{model.state.expedition.enemyEncounter=shadow.state.expedition.enemyEncounter;view.start(false);}));}
 catch(error){if(shade.isValid){shade.destroy();view.notice('提示',error.message);}}
 finally{view.calibrating=false;if(shade.isValid)shade.destroy();}
}
module.exports={start};
