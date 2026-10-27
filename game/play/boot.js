'use strict';
const policy=require('./expedition-config');
const config={...require('./config'),maxStar:policy.maxStar,startingRoster:policy.initialRoster},roster=require('./expedition-roster');
/** 显示真实启动错误，并保留独立存档供恢复。 */
function report(error){wx.hideLoading?.();console.error('[sanguo-playable]',error);globalThis.__sanguoPlayError=String(error.stack||error);wx.showModal({title:'本地版启动失败',content:error.message||String(error),showCancel:false});}
/** 初始化本地引擎和画布；不加载原登录、广告、协议或账号 SDK。 */
async function boot(){
 const release=require('./release-config');
 wx.onTouchStart?.(()=>{const audio=require('./audio-settings').get();if(!audio.started)audio.start();});
 const denied=[];
 for(const method of ['request','downloadFile','connectSocket']){
  const original=wx[method];
  /** 仅放行配置的提醒后端接口，原版外部请求仍被阻止。 */
  wx[method]=function localOnly(options){const url=String(options?.url||'');if(!require('./backend-network-policy').allowed(method,options)&&/^(https?|wss?):\/\//i.test(url)&&!/^http:\/\/usr\//i.test(url)){denied.push({method,url});const error=Error('本地版禁止外网访问: '+method);options?.fail?.({errMsg:error.message});throw error;}return original.call(wx,options);};
 }
 globalThis.__wxRequire=require;require('../web-adapter');require('../src/polyfills.bundle.43263.js');require('../src/system.bundle.f45da.js');
 const importMap=require('../src/import-map.c87de.js').default;
 System.warmup({importMap,importMapUrl:'src/import-map.c87de.js',
  /** 按项目根目录解析引擎模块，保持引擎原脚本路径。 */
  defaultHandler(url){require('..'+url);},
  handlers:{/** 内置脚本由包内模块系统加载。 */'project:'(url){require('../'+url);}},
 });
 const cc=await System.import('cc');require('../engine-adapter');await cc.game.init({debugMode:cc.DebugMode.ERROR,settingsPath:'src/offline-settings.json'});
 cc.game.run(function createLocalScene(){
  const scene=new cc.Scene('SanguoLocalScene'),root=new cc.Node('Canvas');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform).setContentSize(config.layout.width,config.layout.height);root.setPosition(config.layout.width/2,config.layout.height/2,0);const canvas=root.addComponent(cc.Canvas);
  const cameraNode=new cc.Node('LocalCamera');cameraNode.setPosition(config.layout.width/2,config.layout.height/2,1000);const camera=cameraNode.addComponent(cc.Camera);camera.projection=cc.Camera.ProjectionType.ORTHO;camera.orthoHeight=config.layout.height/2;camera.near=.1;camera.far=2000;camera.visibility=cc.Layers.Enum.UI_2D;camera.clearFlags=cc.Camera.ClearFlag.SOLID_COLOR;camera.clearColor=new cc.Color(config.colors.ink);canvas.cameraComponent=camera;scene.addChild(cameraNode);scene.addChild(root);cc.director.runSceneImmediate(scene);
  const {Assets}=require('./assets'),{Expedition:Campaign}=require('./expedition'),{storage}=require('./storage'),{ExpeditionView:PlayView}=require('./expedition-view'),{Widgets}=require('./widgets');
  const globalRank=new (require('./global-rank-runtime').GlobalRankRuntime)(wx);const friendRank=new (require('./friend-rank-runtime').FriendRankRuntime)(wx);const assets=new Assets(cc,wx,config),widgets=new Widgets(cc,assets,config.colors);const intro=require('./startup-view').show(cc,root,widgets);wx.hideLoading?.();
  require('./startup-loader').load(wx,release,assets,roster,intro).then(async()=>{const model=new Campaign(config,roster,storage(wx,config,state=>{friendRank.saved(state);globalRank.saved(state);}));require('./classic-hooks').attach(model,roster);model.simulator=(allies,enemies,list,rules,seed,scale)=>require('./expedition-combat').simulate(allies,enemies,list,require('./player-combat-context').rules(model,rules),seed,scale,model.state.expedition.equipment);await intro.finish();const view=new PlayView(cc,root,assets,model,config,roster);view.shareService=new (require('./share-service').ShareService)(wx);view.shareService.initialize();view.friendRankRuntime=friendRank;view.globalRankRuntime=globalRank;view.permanentUnlocks=require("./permanent-unlocks").attach(model,wx,names=>wx.showToast?.({title:require("./permanent-unlock-config").text+names.join("、"),icon:"none",duration:4000}));globalRank.saved(model.state);require('./fortress-reminders').flush(view.progress);friendRank.initialize(model.state);globalThis.__sanguoPlay={model,view,assets,cc,config,roster,denied,ready:true};console.info('[sanguo-playable] ready',roster.length,'heroes');}).catch(error=>{intro.close();report(error);});
 });
}
boot().catch(report);
