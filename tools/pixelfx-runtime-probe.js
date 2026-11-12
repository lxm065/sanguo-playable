'use strict';
/** 使用真实Cocos和独立内存存档绘制元素技能对照，不连接账号服务。 */
async function start(api,runID,config){
 const fs=api.getFileSystemManager(),base=api.env.USER_DATA_PATH+'/quiet-'+runID,report={runID,phase:'waiting-ready',screens:[],samples:[]};
 let sample,root,host;const hitTimers=new Set();
 /** 只保存本次验收摘要及截图索引。 */
 function persist(){fs.writeFileSync(base+'.json',JSON.stringify(report,null,2),'utf8');}
 /** 等待真实引擎和模型装配，超时保留失败证据。 */
 async function until(check){const end=Date.now()+120000;while(!check()){if(Date.now()>end)throw Error('验收等待超时');await new Promise(resolve=>setTimeout(resolve,100));}}
 /** 宿主在冻结的实际绘制结果上调用官方模拟器截图接口。 */
 async function capture(index){report.phase='capture-ready';report.captureIndex=index;persist();await until(()=>{try{fs.accessSync(base+'-capture-'+index+'.ack');return true;}catch{return false;}});report.screens.push({name:String(index),file:'frame-'+String(index).padStart(3,'0')+'.jpg'});}
 persist();
 try{
  await until(()=>globalThis.__sanguoPlay?.ready);sample=globalThis.__sanguoPlay;
  const before=JSON.stringify(sample.model.state),cc=sample.cc,native=require('./native-effects'),pixel=require('./pixelfx-config');
  root=new cc.Node('elemental-vfx-isolated-qa');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform).setContentSize(config.width,config.height);root.addComponent(cc.BlockInputEvents);sample.view.root.addChild(root);
  host={cc,ui:sample.view.ui,assets:sample.assets,root,config:sample.config,actors:new Map(),speed:1};
  host.ui.image(root,config.background,0,0,config.width,config.height);
  host.ui.box(root,'qa-title',0,config.titleY,config.width,85,'#211C16ED',false);host.ui.text(root,config.title,0,config.titleY,26,'#FFE7B1',config.width);
  host.ui.text(root,config.oldTitle,-config.width/4,config.headerY,23,'#FFE7B1',config.width/2);host.ui.text(root,config.newTitle,config.width/4,config.headerY,23,'#FFE7B1',config.width/2);
  const stage=host.ui.text(root,'',0,config.footerY,22,'#FFE7B1',config.width),demos=[];
  for(const [index,entry] of config.demos.entries()){
   const y=config.rows[index];host.ui.text(root,entry.label,0,y+config.labelOffsetY,21,'#FFF1CD',config.width);
   const pair=[];
   for(const [side,xs] of [config.oldX,config.newX].entries()){
    const uid=index*10+side*2+1,a=host.ui.actor(root,{uid,heroId:entry.heroId,star:3,hp:1000,maxHp:1000,side:'ally'},xs[0],y,config.scale,false);
    const target=host.ui.actor(root,{uid:uid+1,heroId:'xuchu',star:2,hp:1000,maxHp:1000,side:'enemy'},xs[1],y,config.scale,false);
    host.actors.set(uid,a);host.actors.set(uid+1,target);host.ui.face(a,1,0);host.ui.face(target,-1,0);pair.push({a,target,enhanced:side===1,entry});
   }demos.push(pair);
  }
  await until(()=>[...host.actors.values()].every(a=>a.sp.skeletonData));
  await native.warm(host);await sample.assets.sprite('native-effects/lightningStrip.png');
  /** 对照只同步切换表现开关，调用完成立即恢复。 */
  function show(enabled,action){const original=pixel.enabled;try{pixel.enabled=enabled;action();}finally{pixel.enabled=original;}}
  /** 两侧共用正式技能和远程入口，命中仍在真实前摇结束后调用。 */
  function pulse(){
   host.speed=1;for(const actor of host.actors.values())actor.sp.timeScale=1;
   require('./elemental-vfx').clear(host);require('./zhouyu-effects').clear(host);native.clear(host);
   const time=Date.now()/1000,delay=host.config.attackDelay;
   for(const pair of demos)for(const {a,target,enhanced,entry}of pair){
    host.ui.animate(a,entry.kind==='skill'?'skill2':'skill1',false,{speed:1,contactDelay:delay});
    const event={uid:a.unit.uid,target:target.unit.uid,t:time,effect:entry.effect,impactDelay:delay};
    show(enhanced,()=>{if(entry.kind==='skill')require('./skill-effects').ability(host,a,target,event);else require('./battle-effects').projectile(host,a,target,false);});
    const timer=setTimeout(()=>{hitTimers.delete(timer);if(root?.isValid)show(enhanced,()=>require('./battle-effects').hit(host,a,target,{actor:a.unit.uid,target:target.unit.uid,effect:entry.effect,t:time+delay}));},delay*1000);hitTimers.add(timer);
   }
  }
  for(const [index,shot] of config.shots.entries()){
   stage.string=shot.label;pulse();await new Promise(resolve=>setTimeout(resolve,shot.atMs));
   for(const timer of hitTimers)clearTimeout(timer);hitTimers.clear();host.speed=0;native.tick(host);
   for(const actor of host.actors.values())actor.sp.timeScale=0;
   for(const node of host.zhouyuBeams||[]){const opacity=node.getComponent(cc.UIOpacity);if(opacity)cc.Tween.stopAllByTarget(opacity);}
   await new Promise(resolve=>cc.director.once(cc.Director.EVENT_AFTER_DRAW,resolve));
   const active=[...new Set((host.nativeEffects||[]).filter(e=>e.node.isValid).map(e=>e.id))];
   report.samples.push({index,label:shot.label,active,expectedVisible:shot.expected.every(id=>active.includes(id))});
   await capture(index);
  }
  report.loadedEffects=[...host.nativeFrames.keys()];require('./elemental-vfx').clear(host);require('./zhouyu-effects').clear(host);native.clear(host);
  report.timerStopped=host.nativeTimer===null&&host.nativeEffects.length===0;report.modelUnchanged=JSON.stringify(sample.model.state)===before;report.version=require('./app-version').version;
  report.phase=report.timerStopped&&report.modelUnchanged&&report.samples.every(s=>s.expectedVisible)?'passed':'failed';
 }catch(error){report.phase='failed';report.error=String(error.stack||error);}
 finally{for(const timer of hitTimers)clearTimeout(timer);if(host){require('./zhouyu-effects').clear(host);require('./native-effects').clear(host);}if(root?.isValid)root.destroy();persist();}
}
module.exports={start};
