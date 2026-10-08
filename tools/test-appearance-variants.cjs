"use strict";
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const config=require('../game/play/battle-appearance'),policy=require('../game/play/appearance-policy');
test('赵云按配置阶级换外观，其他武将不受影响',()=>{
 const v=config.variants.zhaoyun[0];
 assert.equal(policy.resolve(config,'zhaoyun',v.minStar-1).assetKey,'battle-zhaoyun');
 assert.equal(policy.resolve(config,'zhaoyun',v.minStar).assetKey,v.assetKey);
 assert.equal(policy.resolve(config,'zhaoyun',4).animationKey,'battle-zhaoyun');
 assert.equal(policy.resolve(config,'zhenji',4).assetKey,'battle-zhenji');
 assert(policy.entries(config).some(([,e])=>e.assetKey===v.assetKey));
});
test('双外观引用同一动作时间线，所有帧均有附件，武器无边缘裁切',()=>{
 const root=path.resolve(__dirname,'../game/skin-assets'),read=(key,suffix)=>JSON.parse(fs.readFileSync(path.join(root,key+suffix)));
 const base=read('battle-zhaoyun','.json'),v=config.variants.zhaoyun[0],elite=read(v.assetKey,'.json');
 assert.equal(elite.animations,undefined);
 for(const key of ['battle-zhaoyun',v.assetKey]) {
  const skeleton=read(key,'.json'),m=read(key,'-manifest.json');
  assert.equal(m.compacted.boundaryFrames,0);
  assert.equal(m.sourceType,'lol-glb');
  for(const animation of Object.values(base.animations)) for(const frame of animation.slots.body.attachment)
   if(frame.name)assert(skeleton.skins[0].attachments.body[frame.name],key+' 缺少 '+frame.name);
 }
});

test('资源仓库按阶级读取不同图集，共用动作且缓存互不覆盖',async()=>{
 const {Assets}=require('../game/play/assets');
 class SkeletonData { /** 模拟资源持有。 */ addRef(){} /** 校验组装结果。 */ getRuntimeData(){return !!this.skeletonJson.animations;} }
 const wx={getFileSystemManager:()=>({readFile:({filePath,success,fail})=>fs.readFile(filePath,'utf8',(e,data)=>e?fail(e):success({data}))})};
 const assets=new Assets({sp:{SkeletonData}},wx,{assetsRoot:path.resolve(__dirname,'../game/skin-assets')+path.sep});
 assets.texture=async file=>file;
 const [low,high]=await Promise.all([assets.skeleton('zhaoyun',2),assets.skeleton('zhaoyun',3)]);
 assert.notEqual(low,high);assert.match(low.battleManifest.model,/Skin11/);assert.match(high.battleManifest.model,/Skin12/);
 assert.deepEqual(low.skeletonJson.animations,high.skeletonJson.animations);
 assert.equal(await assets.skeleton('zhaoyun',4),high);
});
