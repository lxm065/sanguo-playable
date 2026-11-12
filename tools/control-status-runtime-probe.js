'use strict';
/** 在离线验收副本中使用正式控制入口，核对附着、刷新、驱散和死亡清理。 */
async function start(api,runID,config){
 const fs=api.getFileSystemManager(),base=api.env.USER_DATA_PATH+'/quiet-'+runID,report={runID,phase:'waiting-ready',screens:[],samples:[]};
 let sample,root,host;
 /** 只保存验收摘要与当前截图索引。 */
 function persist(){fs.writeFileSync(base+'.json',JSON.stringify(report,null,2),'utf8');}
 /** 有界等待实际引擎和模型资源。 */
 async function until(check){const end=Date.now()+120000;while(!check()){if(Date.now()>end)throw Error('控制验收等待超时');await new Promise(resolve=>setTimeout(resolve,100));}}
 /** 等待宿主完成官方模拟器截图。 */
 async function capture(index){report.phase='capture-ready';report.captureIndex=index;persist();await until(()=>{try{fs.accessSync(base+'-capture-'+index+'.ack');return true;}catch{return false;}});report.screens.push({name:String(index),file:'frame-'+String(index).padStart(3,'0')+'.jpg'});}
 persist();
 try{
  await until(()=>globalThis.__sanguoPlay?.ready);sample=globalThis.__sanguoPlay;
  const before=JSON.stringify(sample.model.state),cc=sample.cc,native=require('./native-effects'),controls=require('./control-status-vfx'),pixel=require('./pixelfx-config');
  root=new cc.Node('control-status-isolated-qa');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform).setContentSize(config.width,config.height);root.addComponent(cc.BlockInputEvents);sample.view.root.addChild(root);
  host={cc,ui:sample.view.ui,assets:sample.assets,root,config:sample.config,actors:new Map(),speed:1,elapsed:0};
  host.ui.image(root,config.background,0,0,config.width,config.height);host.ui.box(root,'qa-title',0,config.titleY,config.width,90,'#211C16ED',false);
  host.ui.text(root,config.title,0,config.titleY,27,'#FFE7B1',config.width);host.ui.text(root,config.oldTitle,config.columns[0],config.headerY,25,'#FFE7B1',config.width/2);host.ui.text(root,config.newTitle,config.columns[1],config.headerY,25,'#FFE7B1',config.width/2);
  const stage=host.ui.text(root,'',0,config.footerY,22,'#FFE7B1',config.width),actors=[];
  for(const[index,demo]of config.demos.entries()){
   host.ui.text(root,demo.label,0,config.rows[index]+config.labelOffsetY,25,'#FFF1CD',config.width);
   for(const[side,x]of config.columns.entries()){
    const unit={uid:index*2+side+1,heroId:demo.heroId,star:3,hp:1000,maxHp:1000,side:'ally'},actor=host.ui.actor(root,unit,x,config.rows[index],config.scale,true);
    host.actors.set(unit.uid,actor);actors.push({actor,demo,enhanced:side===1});
   }
  }
  await until(()=>actors.every(a=>a.actor.sp.skeletonData));await native.warm(host);
  /** 同步选择对照路线，完成一次正式入口调用后立即恢复配置。 */
  function show(enabled,action){const original=pixel.enabled;try{pixel.enabled=enabled;action();}finally{pixel.enabled=original;}}
  /** 每张样本从同一状态起点开始；角色身体始终来自真实模型。 */
  function reset(){controls.clear(host);require('./skill-status-view').clear(host);native.clear(host);host.speed=1;host.elapsed=0;
   for(const{actor,demo,enhanced}of actors){actor.alive=true;actor.node.active=true;actor.status.active=true;delete actor.deathRemoval;const opacity=actor.node.getComponent(cc.UIOpacity);if(opacity)opacity.opacity=255;cc.Tween.stopAllByTarget(actor.node);if(opacity)cc.Tween.stopAllByTarget(opacity);host.ui.animate(actor,'idle',true,{speed:1});
    for(const effect of demo.effects)show(enhanced,()=>require('./skill-effects').status(host,actor,{type:'status',t:0,target:actor.unit.uid,effect,duration:config.duration}));
   }
  }
  for(const[index,shot]of config.shots.entries()){
   stage.string=shot.label;reset();await new Promise(resolve=>setTimeout(resolve,shot.refreshAtMs||120));
   if(shot.kind==='refresh'){host.elapsed=(shot.refreshAtMs||120)/1000;for(const{actor,demo,enhanced}of actors)for(const effect of demo.effects)show(enhanced,()=>require('./skill-effects').status(host,actor,{type:'status',t:host.elapsed,target:actor.unit.uid,effect,duration:shot.refreshDuration}));}
   if(shot.kind==='cleanse')for(const{actor,enhanced}of actors)show(enhanced,()=>require('./skill-effects').status(host,actor,{type:'status',t:.12,target:actor.unit.uid,effect:'cleanse',duration:3}));
   if(shot.kind==='death')for(const{actor}of actors)require('./death-view').hide(host,actor);
   await new Promise(resolve=>setTimeout(resolve,shot.atMs));host.speed=0;native.tick(host);require('./skill-status-view').tick(host);
   for(const{actor}of actors){actor.sp.timeScale=0;const opacity=actor.node.getComponent(cc.UIOpacity);if(opacity)cc.Tween.stopAllByTarget(opacity);}
   await new Promise(resolve=>cc.director.once(cc.Director.EVENT_AFTER_DRAW,resolve));
   const active=[...new Set(host.nativeEffects.filter(e=>!e.ended&&e.node.isValid).map(e=>e.id))],count=host.controlStatuses?.size||0;
   report.samples.push({index,kind:shot.kind,active,controls:count,valid:['active','refresh'].includes(shot.kind)?count===4&&active.includes('pixelFrozen')&&active.includes('pixelStunned'):count===0&&!active.includes('pixelFrozen')&&!active.includes('pixelStunned')});
   await capture(index);
  }
  controls.clear(host);require('./skill-status-view').clear(host);native.clear(host);report.timerStopped=host.nativeTimer===null&&host.skillStatusTimer===null;
  report.modelUnchanged=JSON.stringify(sample.model.state)===before;report.version=require('./app-version').version;report.phase=report.timerStopped&&report.modelUnchanged&&report.samples.every(s=>s.valid)?'passed':'failed';
 }catch(error){report.phase='failed';report.error=String(error.stack||error);}
 finally{if(host){require('./control-status-vfx').clear(host);require('./skill-status-view').clear(host);require('./native-effects').clear(host);}if(root?.isValid)root.destroy();persist();}
}
module.exports={start};
