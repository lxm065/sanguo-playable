'use strict';
/** 在实际 Cocos 引擎和独立内存档中验证首页与广告事务；支付和广告事件明确使用桩。 */
async function start(api,runID,qa){
 const fs=api.getFileSystemManager(),base=api.env.USER_DATA_PATH+'/quiet-'+runID,report={runID,phase:'waiting-ready',screens:[],nativePaymentTested:false,nativeVideoPlaybackTested:false};let sample,root,host;
 /** 只保存用例、结果与截图路径，不导出玩家存档。 */
 function persist(){fs.writeFileSync(base+'.json',JSON.stringify(report,null,2),'utf8');}
 /** 有界等待真实游戏启动和界面任务。 */
 async function until(check,timeout=qa.readyTimeoutMs){const end=Date.now()+timeout;while(!check()){if(Date.now()>end)throw Error('运行验收等待超时');await new Promise(resolve=>setTimeout(resolve,qa.pollMs));}}
 /** 由官方 CLI 抓取真实渲染画面，等待落盘回执后继续下一步。 */
 async function capture(name){await new Promise(resolve=>setTimeout(resolve,qa.captureDelayMs));report.captureIndex=report.screens.length;report.phase='capture-ready';report.screens.push({name,file:'frame-'+String(report.captureIndex).padStart(3,'0')+'.jpg'});persist();await until(()=>fs.accessSync?exists(base+'-capture-'+report.captureIndex+'.ack'):false,qa.captureTimeoutMs);report.phase='running';persist();}
 /** 沙盒文件不存在时仅返回 false，不吞掉流程断言。 */
 function exists(file){try{fs.accessSync(file);return true;}catch{return false;}}
 /** 从独立根节点寻找真实 Cocos 按钮。 */
 function find(name,parent=root){if(parent.name===name)return parent;for(const child of parent.children){const found=find(name,child);if(found)return found;}return null;}
 /** 触发控件注册的事件，覆盖用户点击到适配器之间的连接。 */
 function tap(name){const node=find(name);if(!node)throw Error('缺少控件 '+name);node.emit(sample.cc.Node.EventType.TOUCH_END,{target:node,propagationStopped:false});}
 /** 用断言明确区分通过与出现错误提示。 */
 function check(value,message){if(!value)throw Error(message);}
 persist();
 try{
  await until(()=>globalThis.__sanguoPlay?.ready);sample=globalThis.__sanguoPlay;const before=JSON.stringify(sample.model.state),cc=sample.cc;
  report.version=require('./app-version').version;report.actualPlatform=require('./play-benefits').get(api).availability();
  const m=new (require('./expedition').Expedition)(sample.config,sample.roster,{read:()=>null,write(){}});require('./classic-hooks').attach(m,sample.roster);
  root=new cc.Node('play-benefits-isolated-qa');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform).setContentSize(sample.config.layout.width,sample.config.layout.height);sample.view.root.addChild(root);
  host=new sample.view.constructor(cc,root,sample.assets,m,sample.config,sample.roster);
  report.simulatorEntryHidden=!find('play-benefits');check(report.simulatorEntryHidden,'不支持的平台仍展示购买入口');
  const listeners={},calls={show:0,load:0,toast:0};let showOptions;
  const card={load(o){calls.load++;o.success();},show(o){calls.show++;showOptions=o;o.success();}};
  for(const name of ['Load','Show','Close','Error','Use']){listeners[name]=new Set();card['on'+name]=fn=>listeners[name].add(fn);card['off'+name]=fn=>listeners[name].delete(fn);}
  /** 桩只驱动本次独立适配器，不替换全局 wx 或平台的全局单例。 */
  function emit(name,res){for(const fn of listeners[name])fn(res);}
  const platform={getDeviceInfo:()=>({platform:'android'}),getAppBaseInfo:()=>({SDKVersion:'3.17.3',version:'8.0.68'}),createAdSkipCard:()=>card,showToast:()=>{calls.toast++;}};
  host.playBenefits=new (require('./play-benefits').PlayBenefits)(platform);await host.playBenefits.preload();host.render();
  report.supportedEntryVisible=!!find('play-benefits');check(report.supportedEntryVisible,'支持平台首页缺少入口');await capture('home-entry-stubbed-android');
  const original=JSON.stringify(m.state);tap('play-benefits');tap('play-benefits');check(calls.show===1,'重复点击多次打开购买页');emit('Close',{result:'pay_cancel'});await until(()=>!host.playBenefitsOpening);check(JSON.stringify(m.state)===original,'取消购买改变经济');
  tap('play-benefits');showOptions.fail({errCode:-1002});await until(()=>!host.playBenefitsOpening);check(!!find('notice'),'失败没有错误提示');check(JSON.stringify(m.state)===original,'打开失败改变经济');await capture('purchase-failure');host.render();
  tap('play-benefits');emit('Close',{result:'pay_success'});await until(()=>!host.playBenefitsOpening);check(calls.toast===1,'购买结果未提示');check(JSON.stringify(m.state)===original,'购买成功直接发奖');
  let closeVideo,after=0;const video={onClose(fn){closeVideo=fn;},offClose(){},onError(){},offError(){},show:()=>Promise.resolve(),load:()=>Promise.resolve()};
  host.ads=new (require('./ads').RewardedAds)({createRewardedVideoAd:()=>video},require('./classic-config').ads);
  const reward=host.ad(()=>m.progression.add('1',100),()=>after++);emit('Use',{usedCount:1});check(JSON.stringify(m.state)===original,'权益使用事件直接发奖');closeVideo({isEnded:true});await reward;closeVideo({isEnded:true});emit('Use',{usedCount:1});
  report.singleReward=m.state.meta.diamonds===100&&require('./vip').state(m).points===1&&after===1;check(report.singleReward,'奖励或积分不是只提交一次');
  const afterReward=JSON.stringify(m.state),cancel=host.ad(()=>m.progression.add('1',100));emit('Use',{usedCount:2});closeVideo({isEnded:false});await cancel;report.cancelNoReward=JSON.stringify(m.state)===afterReward;check(report.cancelNoReward,'取消广告仍发奖');
  report.playerUnchanged=JSON.stringify(sample.model.state)===before;check(report.playerUnchanged,'真实玩家状态发生改变');report.stubbedNativeCalls=calls;report.phase='passed';
 }catch(error){report.phase='failed';report.error=String(error.stack||error);}finally{host?.playBenefits?.dispose();if(root?.isValid)root.destroy();persist();}
}
module.exports={start};
