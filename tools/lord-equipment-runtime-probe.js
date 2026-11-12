'use strict';
/** 真实微信引擎内运行独立存档与UI，不读写玩家经济和章节。 */
async function start(api,runID){const fs=api.getFileSystemManager(),base=api.env.USER_DATA_PATH+'/quiet-'+runID,report={runID,phase:'waiting-ready',screens:[]};let sample,root,host;
 /** 报告只含验收结果、异常和截图路径，不导出玩家存档。 */
 function persist(){fs.writeFileSync(base+'.json',JSON.stringify(report,null,2),'utf8');}
 /** 等待资源或渲染完成，超时留下实际失败证据。 */
 async function until(check){const end=Date.now()+120000;while(!check()){if(Date.now()>end)throw Error('引擎未就绪');await new Promise(resolve=>setTimeout(resolve,100));}}
 /** 在真实绘制完成后导出游戏画布，截图失败明确记录。 */
 async function capture(name){await new Promise(resolve=>setTimeout(resolve,500));const canvas=sample.cc.game.canvas||(typeof GameGlobal!=='undefined'?GameGlobal.screencanvas:null);await new Promise(resolve=>{let done=false;
  /** 仅从本次游戏画布导出图片，不访问其他应用。 */
  function save(){if(done)return;done=true;clearTimeout(timer);try{const file=base+'-'+name+'.png';if(typeof canvas?.toTempFilePathSync==='function')fs.copyFileSync(canvas.toTempFilePathSync({fileType:'png'}),file);else{const data=canvas?.toDataURL?.('image/png');if(!data?.startsWith('data:image/png;base64,'))throw Error('截图接口不可用');fs.writeFileSync(file,data.split(',')[1],'base64');}report.screens.push({name,file:file.split('/').pop()});}catch(error){report.captureError=String(error.message||error);}resolve();}const timer=setTimeout(save,2000);sample.cc.director.once(sample.cc.Director.EVENT_AFTER_DRAW,save);});}
 /** 递归寻找真实控件，按钮操作走已注册的触摸事件。 */
 function find(name,parent=root){if(parent.name===name)return parent;for(const child of parent.children){const found=find(name,child);if(found)return found;}return null;}
 /** 使用真实按钮事件，确认UI确实连接领域事务。 */
 function tap(name){const node=find(name);if(!node)throw Error('缺少控件 '+name);node.emit(sample.cc.Node.EventType.TOUCH_END,{target:node,propagationStopped:false});}
 persist();try{await until(()=>globalThis.__sanguoPlay?.ready);sample=globalThis.__sanguoPlay;const before=JSON.stringify(sample.model.state),cc=sample.cc,m=new (require('./expedition').Expedition)(sample.config,sample.roster,{read:()=>null,write(){}});require('./classic-hooks').attach(m,sample.roster);m.transact(()=>{m.state.meta.cleared=60;m.state.meta.signs=30;});m.progression.select('1007');m.transact(()=>{m.addEquipment(require('./equipment-pool-config').blue[0]);m.addEquipment(require('./equipment-pool-config').blue[1]);});root=new cc.Node('lord-equipment-isolated-qa');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform).setContentSize(720,1280);sample.view.root.addChild(root);
  host=Object.assign(Object.create(Object.getPrototypeOf(sample.view)),{cc,ui:sample.view.ui,assets:sample.assets,root,model:m,progress:m.progression,roster:sample.roster,config:sample.config,actors:new Map(),page:'battle',playing:false,speed:1,
   /** 每次成功操作只清理独立验收根节点，保留玩家界面。 */
   render(){for(const n of [...root.children]){n.removeFromParent();n.destroy();}},
   /** 测试遇到业务失败立即报告，不能把提示框当作成功。 */
   notice(title,message){throw Error(title+':'+message);}
  });host.battleHud=new (require('./battle-hud').BattleHud)(host);require('./expedition-header').render(host);tap('battle-lord-avatar');await capture('liubiao-exchange');tap('equipment-1');tap('equipment-2');await capture('liubiao-selected');tap('兑换（2/2）');report.exchange=m.state.expedition.equipment.length===1&&require('./equipment-pool-config').purple.includes(m.state.expedition.equipment[0].id);require('./lord-skill-view').cancel(host);host.render();m.progression.select('1002');const item=m.state.expedition.equipment[0];m.transact(()=>{item.stacks=12;});require('./equipped-item-details').showEquippedItem(host,root,item,()=>{},true);await capture('sunjian-blessing');report.blessedDetail=!!find('blessed-equipment-detail');report.playerUnchanged=JSON.stringify(sample.model.state)===before;report.version=require('./app-version').version;report.phase=report.exchange&&report.blessedDetail&&report.playerUnchanged?'passed':'failed';
 }catch(error){report.phase='failed';report.error=String(error.stack||error);}finally{if(host)require('./lord-skill-view').cancel(host);if(root?.isValid)root.destroy();persist();}}
module.exports={start};
