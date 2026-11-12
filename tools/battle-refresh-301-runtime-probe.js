'use strict';
/** 独立引擎验收入口：只用内存档，不启动账号、云存档或玩家游戏进度。 */
async function start(api,runID){
 const fs=api.getFileSystemManager(),base=api.env.USER_DATA_PATH+'/quiet-'+runID,report={runID,phase:'booting',screens:[],cases:[],playerStorageUsed:false};let v;
 /** 验收仅在模拟器沙盒保存本次报告。 */
 function persist(){fs.writeFileSync(base+'.json',JSON.stringify(report,null,2),'utf8');}
 /** 所有模型加载和宿主截图等待均有截止时间。 */
 async function until(check){const end=Date.now()+90000;while(!check()){if(Date.now()>end)throw Error('引擎验收等待超时');await new Promise(r=>setTimeout(r,100));}}
 /** 断言失败立即保留现场原因，不将部分成功当作通过。 */
 function check(value,message){if(!value)throw Error(message);}
 /** 只导出本测试自建画布，不截图开发工具或其他应用，也不申请工具远程控制权限。 */
 async function capture(name){await new Promise(r=>setTimeout(r,400));await new Promise((resolve,reject)=>v.cc.director.once(v.cc.Director.EVENT_AFTER_DRAW,()=>{try{const canvas=v.cc.game.canvas||(typeof GameGlobal!=='undefined'?GameGlobal.screencanvas:null),file=base+'-'+name+'.png';if(typeof canvas?.toTempFilePathSync==='function')fs.copyFileSync(canvas.toTempFilePathSync({fileType:'png'}),file);else{const data=canvas?.toDataURL?.('image/png');if(!data?.startsWith('data:image/png;base64,'))throw Error('独立画布无法导出');fs.writeFileSync(file,data.split(',')[1],'base64');}report.screens.push({name,file:file.split('/').pop()});persist();resolve();}catch(error){reject(error);}}));}
 persist();
 try{
  require('../web-adapter');require('../src/polyfills.bundle.43263.js');require('../src/system.bundle.f45da.js');
  System.warmup({importMap:require('../src/import-map.c87de.js').default,importMapUrl:'src/import-map.c87de.js',defaultHandler(url){require('..'+url);},handlers:{'project:'(url){require('../'+url);}}});
  const cc=await System.import('cc');require('../engine-adapter');await cc.game.init({debugMode:cc.DebugMode.ERROR,settingsPath:'src/offline-settings.json'});
  await new Promise(resolve=>cc.game.run(resolve));
  const config={...require('./config'),maxStar:5},roster=require('./expedition-roster'),scene=new cc.Scene('RefreshQA'),root=new cc.Node('Canvas');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform).setContentSize(720,1280);root.setPosition(360,640,0);const canvas=root.addComponent(cc.Canvas),cameraNode=new cc.Node('Camera');cameraNode.setPosition(360,640,1000);const camera=cameraNode.addComponent(cc.Camera);camera.projection=cc.Camera.ProjectionType.ORTHO;camera.orthoHeight=640;camera.near=.1;camera.far=2000;camera.visibility=cc.Layers.Enum.UI_2D;camera.clearFlags=cc.Camera.ClearFlag.SOLID_COLOR;canvas.cameraComponent=camera;scene.addChild(cameraNode);scene.addChild(root);cc.director.runSceneImmediate(scene);
  const release=require('./release-config');if(release.assetPackage)await new Promise((resolve,reject)=>api.loadSubpackage({name:release.assetPackage,success:resolve,fail:reject}));
  const assets=new(require('./assets').Assets)(cc,api,config),ui=new(require('./widgets').Widgets)(cc,assets,config.colors),m=new(require('./expedition').Expedition)(config,roster,{read:()=>null,write(){}});require('./classic-hooks').attach(m,roster);
  Object.assign(m.state.meta,{chapter:5,section:5,cleared:4,lord:'1002'});m.state.expedition.level=8;m.state.units=Array.from({length:60},(_,i)=>({uid:i+1,heroId:[0,8,9].includes(i)?'zhaoyun':'xuchu',star:i<10?3:1,slot:i<8?i:-1}));m.state.nextUid=61;m.state.expedition.equipment=Array.from({length:18},(_,i)=>({uid:i+1,id:['7206','7202','7001','7009','7105','7203'][i%6],owner:i<12?Math.floor(i/3)+1:null}));m.state.expedition.nextEquipment=19;const route=m.progression.nodes().find(n=>n.type==='battle');Object.assign(m.state.meta,{activeNode:route.id,layer:route.row});m.transact(()=>{require('./enemy-budget').lock(m);m.state.expedition.heroObtained=roster.map(h=>h.id);});m.state.expedition.sunjian.shown=true;
  const counts={renders:0,actors:0,writes:0},View=require('./expedition-view').ExpeditionView,draw=ui.actor.bind(ui);ui.actor=(...args)=>{counts.actors++;return draw(...args);};m.storage.write=()=>counts.writes++;
  v=Object.create(View.prototype);Object.assign(v,{cc,root,assets,ui,config,roster,model:m,progress:m.progression,page:'battle',actors:new Map(),benchPage:0,speed:1,playing:false,render(){counts.renders++;return View.prototype.render.call(this);}});v.render();
  /** 等待真实Spine装配，不把尚未解析的占位节点误认作复用成功。 */
  async function ready(){await until(()=>[...v.actors.values()].every(a=>!!a.sp.skeletonData));await new Promise(r=>cc.director.once(cc.Director.EVENT_AFTER_DRAW,r));}
  /** 通过真实按钮事件调用产品操作链。 */
  function tap(name,parent=v.modal){const node=parent.children.find(n=>n.name===name);check(node,'缺少按钮 '+name);node.emit(cc.Node.EventType.TOUCH_END,{target:node,propagationStopped:false});}
  /** 记录单个同步处理耗时和模型装配数量，不作为手机帧率。 */
  function measure(name,action,verify){const before={...counts},start=Date.now();action();const result={name,handlerMs:Date.now()-start,renders:counts.renders-before.renders,createdActors:counts.actors-before.actors,writes:counts.writes-before.writes};verify();report.cases.push(result);persist();}
  await ready();await capture('before-merge');
  const actor=v.actors.get(2),body=actor.body,header=v.battleHeader,background=root.children[0],button=v.battleStartButton;
  v.mergePanel(1);measure('same-merge',()=>tap('原地合成'),()=>{check(counts.renders===1,'合成重绘了整页');check(v.actors.get(2)===actor&&actor.body===body,'合成替换了无关武将');check(v.battleHeader===header&&root.children[0]===background&&v.battleStartButton===button,'固定界面被替换');check(m.unit(1).star===4&&!m.state.units.some(u=>[9,10].includes(u.uid)),'合成结果错误');});await ready();await capture('after-merge');
  measure('same-slot-drop',()=>v.act(()=>m.deploy(2,m.unit(2).slot)),()=>check(v.actors.get(2)===actor,'同格落子替换武将'));
  const initial=m.state.units.filter(u=>u.slot>=0).map(u=>({...u,side:'ally',x:u.slot%config.columns,y:Math.floor(u.slot/config.columns),hp:100,maxHp:100}));m.state.pending={id:m.state.battles+1,stage:m.state.stage,training:false,rewardKind:'heroes',choices:['xuchu','guanyu','zhaoyun'],rewardStar:1,gold:50,experience:require('./level-progression').cost(m.state.expedition.level),refreshes:0,battle:{initial,final:initial.map((u,i)=>({...u,hp:i?50:0,x:0,y:1})),result:'win',events:[],duration:1}};m.state.meta.inventory[require('./reward-refresh-config').item]=3;v.render();await ready();await capture('reward');
  const survivors=new Map(v.actors),baseRenders=counts.renders;
  measure('refresh-reward',()=>tap(''),()=>{check(counts.renders===baseRenders,'刷新奖励重绘整页');for(const [id,a]of survivors)check(v.actors.get(id)===a,'刷新奖励替换战后演员');check(m.state.meta.inventory[require('./reward-refresh-config').item]===2,'刷新扣费错误');});
  const reserve=v.actors.get(11),resource=v.battleHeader;
  measure('claim-and-level-up',()=>tap('选择'),()=>{check(counts.renders===baseRenders,'领奖重绘整页');check(v.actors.get(11)===reserve,'领奖替换无关备战武将');check(v.battleHeader===resource&&resource.level.string==='等级 9','升级资源栏未原地更新');check(m.state.pending===null,'待领状态未清除');check(v.actors.get(1)?.node.active,'死亡棋子未恢复');check(button!==v.battleStartButton,'战果测试应使用新场景按钮');});await ready();await capture('claimed-and-level-up');
  check(report.cases.every(r=>r.renders===0&&r.writes===1),'成功操作重复重绘或重复写盘');report.version=require('./app-version').version;report.phase='passed';
 }catch(error){report.phase='failed';report.error=String(error.stack||error);}
 finally{if(v){clearTimeout(v.panelWarmTimer);require('./battle-effects').clear(v);require('./lord-skill-view').cancel(v);}persist();}
}
module.exports={start};
