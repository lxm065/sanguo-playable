'use strict';
const config=require('./bond-trigger-config'),query=require('./bond-trigger');
/** 缓存原版二进制 Spine，解析失败可重试，失败不影响布阵事务。 */
function load(v){
 const key='original-bond-trigger';
 if(!v.assets.cache.has(key)){
  const fs=v.assets.wx.getFileSystemManager();
  const read=(file,encoding)=>new Promise((resolve,reject)=>fs.readFile({filePath:v.assets.config.assetsRoot+config.directory+file,...(encoding?{encoding}:{}),success:r=>resolve(r.data),fail:reject}));
  v.assets.cache.set(key,Promise.all([read(config.binary),read(config.atlas,'utf8'),v.assets.texture(config.directory+config.texture)]).then(([binary,atlas,texture])=>{
   const data=new v.cc.sp.SkeletonData();data.name=key;data._uuid=key;data._nativeAsset=binary;data.atlasText=atlas;data.textures=[texture];data.textureNames=[config.textureName];
   if(!data.getRuntimeData())throw Error('原版羁绊动画解析失败');data.addRef();return data;
  }).catch(error=>{v.assets.cache.delete(key);throw error;}));
 }
 return v.assets.cache.get(key);
}
/** 布阵预热原动画和飞行光球，首次上阵也能立即触发。 */
function warm(v){return Promise.all([load(v),v.assets.sprite(config.directory+'orb.png')]).catch(e=>console.warn('羁绊特效预热失败',e.message));}
/** 页面与开战统一撤销补间和迟到的资源回调。 */
function clear(v){
 v.bondTriggerGeneration=(v.bondTriggerGeneration||0)+1;
 for(const n of v.bondTriggerNodes||[]){v.cc.Tween.stopAllByTarget(n);if(n.isValid)n.destroy();}
 v.bondTriggerNodes=[];
}
/** 登记短生命周期节点；销毁节点不留在下一轮登记表。 */
function track(v,n){v.bondTriggerNodes=(v.bondTriggerNodes||[]).filter(x=>x.isValid);v.bondTriggerNodes.push(n);return n;}
/** 光球沿原版时长飞到对应羁绊栏，独立光圈闪烁避免缩放可交互徽章。 */
function fly(v,point,id,index){
 const target=v.root.getChildByName('bond-'+id);if(!target?.isValid)return;
 const n=track(v,v.ui.image(v.root,config.directory+'orb.png',point.x,point.y+config.flyOffsetY,config.flySize,config.flySize));n.name='bond-fly-'+id;n.getComponent(v.cc.Sprite).color=new v.cc.Color(config.colors[index]);
 v.cc.tween(n).to(config.flySeconds,{position:new v.cc.Vec3(target.position.x,target.position.y,0)}).call(()=>{
  if(!n.isValid)return;
  v.cc.tween(n).to(config.pulseSeconds,{scale:new v.cc.Vec3(config.pulseScale,config.pulseScale,1)}).to(config.pulseSeconds,{scale:new v.cc.Vec3(0,0,1)}).call(()=>{if(n.isValid)n.destroy();}).start();
 }).start();
}
/** 原版环绕光、羁绊图标和地面光随整组武将同时出现，多羁绊错峰播放。 */
function play(v,data,actor,bond,delay){
 const index=config.originalOrder.indexOf(config.sources[bond.id])+1;if(!index||!actor?.node?.isValid)return;
 const point={x:actor.node.position.x,y:actor.node.position.y+config.offsetY};
 const n=track(v,v.ui.node(v.root,'bond-trigger-'+bond.id,point.x,point.y));n.setScale(config.scale,config.scale,1);
 v.cc.tween(n).delay(delay).call(()=>{
  if(!n.isValid)return;
  const skeleton=n.addComponent(v.cc.sp.Skeleton);skeleton.skeletonData=data;skeleton.setAnimation(0,'skill'+index,false);
  skeleton.setCompleteListener(()=>{if(n.isValid)n.destroy();});
 }).delay(config.cleanupSeconds).call(()=>{if(n.isValid)n.destroy();}).start();
 // 飞行调度独立于 Spine 节点，避免原动画完成回收时取消飞行。
 const timer=track(v,v.ui.node(v.root,'bond-flight-timer',0,0));
 v.cc.tween(timer).delay(delay+config.flyDelaySeconds).call(()=>{if(timer.isValid){fly(v,point,bond.id,index);timer.destroy();}}).start();
}
/** 只在成功事务且仍是同一布阵页面时播放，异步加载不会污染新页面或战斗。 */
function show(v,previous){
 if(v.page!=='battle'||v.playing)return Promise.resolve();
 const changed=query.changes(previous,query.snapshot(v.model,v.roster));if(!changed.length)return Promise.resolve();
 const generation=v.bondTriggerGeneration;
 return load(v).then(data=>{
  if(generation!==v.bondTriggerGeneration||v.page!=='battle'||v.playing)return;
  const offsets=new Map();
  for(const bond of changed)for(const uid of bond.members){const delay=offsets.get(uid)||0;play(v,data,v.actors.get(uid),bond,delay);offsets.set(uid,delay+config.staggerSeconds);}
 }).catch(e=>console.warn('羁绊特效播放失败',e.message));
}
module.exports={load,warm,clear,show};
