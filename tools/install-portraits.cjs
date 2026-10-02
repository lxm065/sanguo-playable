'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),config=require('../game/play/portrait-config'),sources=require('./portrait-sources.cjs'),concepts=require('../source-assets/portrait-concepts.json');
const sharp=require('../../analysis-work/node_modules/sharp');
/** 计算素材摘要，使交付头像与来源清单可逐文件校验。 */
function hash(file){return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');}
/** 安装已审阅静态头像；只写头像文件及来源清单，不触及模型、图集和存档。 */
async function main(){const manifest={version:1,size:config.size,background:config.background,scope:'静态头像；模型和动作未替换',entries:[]};for(const [id,entry] of Object.entries(config.entries)){
 let file,record;if(entry.sourceType==='model-render'){file=path.join(root,'evidence/portrait-candidates',id+'.png');const meta=JSON.parse(fs.readFileSync(path.join(root,'evidence/portrait-candidates',id+'.json'),'utf8')),row=sources.rows.find(r=>r[0]===id);record={id,type:entry.sourceType,sourceRoot:sources.roots[row[1]],model:meta.model,camera:meta.camera,sequence:meta.sequence,dependencies:Object.fromEntries(Object.entries(meta.dependencies).map(([relative,value])=>[relative,{sha256:value.sha256}]))};}else{const concept=concepts.find(c=>c.id===id);file=concept.source;record={id,type:'concept',modelPending:true,note:'外观方案，模型待制作',tool:concept.tool,sourceImage:path.basename(file),sourceSha256:hash(file),prompt:concept.prompt,references:concept.references};}
 const dest=path.join(root,'game/skin-assets',entry.file);fs.mkdirSync(path.dirname(dest),{recursive:true});await sharp(file).resize(config.size,config.size,{fit:'contain',background:config.background}).png({compressionLevel:9}).toFile(dest);record.file=entry.file;record.sha256=hash(dest);manifest.entries.push(record);
 }fs.writeFileSync(path.join(root,'source-assets/portrait-manifest.json'),JSON.stringify(manifest,null,2)+'\n');fs.writeFileSync(path.join(root,'source-assets/handbook-portraits.json'),JSON.stringify({supersededBy:'portrait-manifest.json',note:'旧插画已被卡通头像替换；旧版本来源可查 Git 历史。'},null,2)+'\n');console.log('已安装 '+manifest.entries.length+' 张静态头像');}
main().catch(error=>{console.error(error);process.exitCode=1;});
