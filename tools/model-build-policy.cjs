'use strict';
const fs=require('node:fs'),path=require('node:path');
/** 限制清单引用为资源目录内的单个文件，拒绝路径越界。 */
function assetFile(directory,name){
 if(!name||path.basename(name)!==name||/[\\/]/.test(name))throw Error('模型资源路径非法 '+name);
 return path.resolve(directory,name);
}
/** 按运行时模型注册表计算可从发布包省略的历史模型文件，保护共享贴图。 */
function inactiveModelAssets(directory,activeKeys){
 const active=new Set(activeKeys),retained=new Set(),candidates=new Set();
 for(const name of fs.readdirSync(directory).filter(n=>n.endsWith('-manifest.json'))){
  const key=name.slice(0,-'-manifest.json'.length),manifest=JSON.parse(fs.readFileSync(assetFile(directory,name),'utf8'));
  const files=[name,key+'.json',key+'.atlas',...manifest.textures].map(n=>assetFile(directory,n)),target=active.has(key)?retained:candidates;
  for(const file of files)target.add(file);
 }
 return new Set([...candidates].filter(file=>!retained.has(file)));
}
/** 校验发布包中每个当前模型的骨骼、图集与全部贴图依赖都存在。 */
function verifyActiveModels(directory,activeKeys){
 for(const key of activeKeys){
  const manifest=JSON.parse(fs.readFileSync(assetFile(directory,key+'-manifest.json'),'utf8'));
  for(const name of [key+'.json',key+'.atlas',...manifest.textures])if(!fs.existsSync(assetFile(directory,name)))throw Error('发布模型依赖缺失 '+name);
 }
}
module.exports={inactiveModelAssets,verifyActiveModels};
