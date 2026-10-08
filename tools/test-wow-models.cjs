'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const config=require('./wow-models.config.json'),root=path.resolve(__dirname,'..');
/** 验证真实蒙皮 GLB、源文件依赖摘要以及无裁切的游戏动作契约。 */
test('四位魔兽模型保留蒙皮、武器、五套原生动作及全部方向',()=>{
 for(const [id,spec] of Object.entries(config.heroes)){
  const m=require('../game/skin-assets/battle-'+id+'-manifest.json'),source=require('../'+config.output+'/'+id+'.json'),skeleton=require('../game/skin-assets/battle-'+id+'.json');
  assert(m.nativeWow);assert.equal(m.sourceModel,spec.model);assert.equal(m.compacted.boundaryFrames,0,id);assert(m.bones>=50);
  const glb=fs.readFileSync(path.join(root,m.model));assert.equal(glb.toString('ascii',0,4),'glTF');assert.equal(glb.readUInt32LE(8),glb.length);assert.equal(crypto.createHash('sha256').update(glb).digest('hex'),m.sha256);
  const json=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));assert(json.skins.length>0);assert(json.meshes.some(mesh=>mesh.primitives.some(p=>p.attributes.JOINTS_0!==undefined)));assert.equal(json.animations.length,5);
  assert.equal(source.weapons.length,spec.weapons.length);
  for(const weapon of source.weapons){assert(m.dependencies[weapon.config.model]);assert(source.body.attachments.some(a=>a.id===weapon.config.attachment));}
  for(const [file,record] of Object.entries(m.dependencies)){const data=fs.readFileSync(path.join(config.assetRoot,file));assert.equal(crypto.createHash('sha256').update(data).digest('hex'),record.sha256,file);}
  for(const action of Object.keys(spec.actions)){
   assert(m.movements[action]>.0001,id+' '+action+' 未发生蒙皮形变');
   for(const direction of ['s','se','e','ne','n']){const key=action+'-'+direction,frames=skeleton.animations[key].slots.body.attachment;assert(m.actions[key]);assert.equal(frames[1].time,1/config.fps);assert.equal(frames.at(-1).time,m.actions[key].duration);}
  }
 }
});
/** 逐顶点校验蒙皮权重与骨骼索引，避免解析错位产生拉伸或飞点。 */
test('蒙皮顶点权重规范且全部贴图有真实来源',()=>{
 for(const id of Object.keys(config.heroes)){
  const source=require('../'+config.output+'/'+id+'.json'),b=source.body;
  assert.equal(b.weights.length,b.geometries[0].positions.length/3*4);
  for(let i=0;i<b.weights.length;i+=4){assert(Math.abs(b.weights.slice(i,i+4).reduce((a,v)=>a+v,0)-1)<.001,id);for(let k=0;k<4;k++)assert(b.boneIndices[i+k]<b.bones.length);}
  for(const part of [b,...source.weapons.map(w=>w.data)])for(const mesh of part.meshes.filter(m=>m.visible))assert(fs.statSync(path.join(root,config.output,mesh.textureFile)).size>0);
 }
});
