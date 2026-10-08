'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs'),os=require('node:os');
const {inactiveModelAssets,verifyActiveModels}=require('./model-build-policy.cjs');
/** 当前注册表使用的资源及与旧模型共享的贴图不得被过滤。 */
test('发布筛选只排除未启用模型，保留共享贴图且拒绝越界清单',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sanguo-model-policy-'));
 try{
  fs.writeFileSync(path.join(dir,'old-manifest.json'),JSON.stringify({textures:['old.png','shared.png']}));
  fs.writeFileSync(path.join(dir,'active-manifest.json'),JSON.stringify({textures:['shared.png']}));
  for(const name of ['active.json','active.atlas','shared.png'])fs.writeFileSync(path.join(dir,name),'fixture');
  const excluded=inactiveModelAssets(dir,['active']);assert(excluded.has(path.join(dir,'old.png')));assert(!excluded.has(path.join(dir,'shared.png')));verifyActiveModels(dir,['active']);
  fs.writeFileSync(path.join(dir,'old-manifest.json'),JSON.stringify({textures:['../outside.png']}));assert.throws(()=>inactiveModelAssets(dir,['active']),/路径非法/);
 }finally{if(path.dirname(path.resolve(dir))!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('sanguo-model-policy-'))throw Error('临时目录边界异常');fs.rmSync(dir,{recursive:true,force:true});}
});
/** 验证真实开发资源的当前模型完整，避免误过滤仍使用的诸葛亮旧模型。 */
test('实际注册表包含的模型与诸葛亮旧模型全部保留',()=>{
 const appearance=require('../game/play/battle-appearance'),keys=[...Object.values(appearance.models),...Object.values(appearance.legacy)].map(e=>e.assetKey),dir=path.resolve(__dirname,'../game/skin-assets');
 const excluded=inactiveModelAssets(dir,keys);verifyActiveModels(dir,keys);assert(excluded.has(path.join(dir,'zhaoyun-manifest.json')));assert(!excluded.has(path.join(dir,'zhugeliang-manifest.json')));
});
