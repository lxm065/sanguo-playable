'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const config=require('./authored-models.config.json'),root=path.resolve(__dirname,'..');
/** 旧版原创建模源文件作为历史方案保留，已不再约束当前战场资源。 */
test('旧版原创源模型保留可编辑网格和五套动作',()=>{
 for(const id of Object.keys(config.heroes)){
  const glb=fs.readFileSync(path.join(root,'source-assets/authored-models',id+'.glb'));assert.equal(glb.toString('ascii',0,4),'glTF');assert.equal(glb.readUInt32LE(4),2);assert.equal(glb.readUInt32LE(8),glb.length);
  const json=JSON.parse(glb.toString('utf8',20,20+glb.readUInt32LE(12)));
  assert(json.meshes.length>20,id);assert.deepEqual(json.animations.map(a=>a.name).sort(),['dead','idle','run','skill1','skill2']);
  for(const animation of json.animations){assert(animation.channels.length>10);for(const s of animation.samplers)assert(json.accessors[s.input].count>2);}
 }
});
