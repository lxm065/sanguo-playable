'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),config=require('../game/play/portrait-config'),sources=require('./portrait-sources.cjs'),concepts=require('../source-assets/portrait-concepts.json');
const sharp=require('../../analysis-work/node_modules/sharp');
/** 计算实际交付文件摘要，便于来源审计。 */
function hash(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
/** 根据来源类型读取素材，头像生成与游戏模型加载互不耦合。 */
function sourceFor(id,entry){
 if(entry.sourceType==='wow-model-render'){
  const native=require('./wow-models.config.json'),manifest=JSON.parse(fs.readFileSync(path.join(root,'game/skin-assets/battle-'+id+'-manifest.json'),'utf8'));
  return {file:path.join(root,native.output,id+'-portrait.png'),record:{id,type:entry.sourceType,modelPending:false,sourceRoot:native.assetRoot,model:native.heroes[id].model,renderedModel:manifest.model,camera:native.camera,dependencies:manifest.dependencies}};
 }
 if(entry.sourceType==='model-render'){
  const meta=JSON.parse(fs.readFileSync(path.join(root,'evidence/portrait-candidates',id+'.json'),'utf8')),row=sources.rows.find(r=>r[0]===id);
  return {file:path.join(root,'evidence/portrait-candidates',id+'.png'),record:{id,type:entry.sourceType,sourceRoot:sources.roots[row[1]],model:meta.model,camera:meta.camera,sequence:meta.sequence,dependencies:Object.fromEntries(Object.entries(meta.dependencies).map(([relative,value])=>[relative,{sha256:value.sha256}]))}};
 }
 if(entry.sourceType!=='concept')throw Error('不支持的头像来源 '+entry.sourceType);
 const concept=concepts.find(c=>c.id===id),file=concept.source;
 return {file,record:{id,type:'concept',modelPending:entry.modelPending,note:entry.modelPending?'外观方案，模型待制作':'外观方案头像',tool:concept.tool,sourceImage:path.basename(file),sourceSha256:hash(file),prompt:concept.prompt,references:concept.references}};
}
/** 安装指定头像并保留未选中的清单和素材；无参数时重建全部头像。 */
async function main(){
 const manifestFile=path.join(root,'source-assets/portrait-manifest.json'),selected=process.argv.slice(2),previous=fs.existsSync(manifestFile)?JSON.parse(fs.readFileSync(manifestFile,'utf8')):{entries:[]},records=new Map(previous.entries.map(e=>[e.id,e]));
 const ids=selected.length?selected:Object.keys(config.entries);
 for(const id of ids){
  const entry=config.entries[id];if(!entry)throw Error('未知武将 '+id);
  const {file,record}=sourceFor(id,entry),dest=path.join(root,'game/skin-assets',entry.file);
  fs.mkdirSync(path.dirname(dest),{recursive:true});await sharp(file).resize(config.size,config.size,{fit:'contain',background:config.background}).png({compressionLevel:9}).toFile(dest);
  records.set(id,{...record,file:entry.file,sha256:hash(dest)});
 }
 const manifest={version:config.version,size:config.size,background:config.background,scope:'武将头像来源清单；魔兽资源头像与对应战斗模型一致',entries:Object.keys(config.entries).map(id=>{if(!records.has(id))throw Error('未生成头像 '+id);return records.get(id);})};
 fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2)+'\n');console.log('已安装 '+ids.length+' 张头像');
}
if(require.main===module)main().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={sourceFor};
