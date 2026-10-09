'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),source=path.join(root,'game');
const config=JSON.parse(fs.readFileSync(process.argv[2]||path.join(__dirname,'wechat-release.config.json'),'utf8'));
const output=path.resolve(root,config.output);
const {inactiveModelAssets,verifyActiveModels}=require('./model-build-policy.cjs'),appearance=require('../game/play/battle-appearance');
const activeKeys=[...require("../game/play/appearance-policy").entries(appearance).map(([,entry])=>entry),...Object.values(appearance.legacy)].map(entry=>entry.assetKey);
/** 枚举构建产物，用于压缩与包体校验。 */
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
/** 写出可审阅的发布配置，避免修改原始素材和开发入口。 */
function json(file,value){fs.writeFileSync(path.join(output,file),JSON.stringify(value,null,2)+'\n');}
/** 按白名单建立独立发布目录；仅允许清理本仓库 dist 下的生成目录。 */
async function build(){
 if(!output.startsWith(path.join(root,'dist')+path.sep))throw Error('发布目录必须位于仓库 dist 下');
 execFileSync(config.pngquant,['--version'],{stdio:'pipe'});
 fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
 const excluded=config.omitInactiveModelAssets?inactiveModelAssets(path.join(source,config.assetDirectory),activeKeys):new Set();
 for(const item of [...config.copy,config.assetDirectory])fs.cpSync(path.join(source,item),path.join(output,item),{recursive:true,filter:file=>!excluded.has(path.resolve(file))});
 require('./friend-rank-build.cjs').install(output);
 verifyActiveModels(path.join(output,config.assetDirectory),activeKeys);
 if(config.imageBudget)await require("./release-image-budget.cjs").prepare(path.join(output,config.assetDirectory),appearance,config.imageBudget);
 const assetAliases={};
 // UI母版仅在发布副本按配置缩小，保持透明通道和原始宽高比。
 for(const entry of config.uiImages||[]){const sharp=require('../../analysis-work/node_modules/sharp'),file=path.join(output,config.assetDirectory,entry.file),bytes=fs.readFileSync(file);fs.writeFileSync(file,await sharp(bytes).resize({width:entry.width,withoutEnlargement:true}).png().toBuffer());}
 // 装备插画只在发布副本缩放；源 PNG 留作美术母版，透明图仍保留 PNG。
 if(config.equipmentImages){
  const sharp=require('../../analysis-work/node_modules/sharp');
  for(const id of Object.keys(require('../game/play/equipment-theme'))){
   const name='equipment/'+id+'.png',file=path.join(output,config.assetDirectory,name),input=fs.readFileSync(file),meta=await sharp(input).metadata();
   const resized=sharp(input).resize({width:config.equipmentImages.width,withoutEnlargement:true});
   if(meta.hasAlpha)fs.writeFileSync(file,await resized.png().toBuffer());
   else{const target=name.replace(/\.png$/,'.jpg');await resized.jpeg({quality:config.equipmentImages.quality,mozjpeg:true}).toFile(path.join(output,config.assetDirectory,target));fs.unlinkSync(file);assetAliases[name]=target;}
  }
 }
 // 非透明背景保留原尺寸，用高质量 JPEG 避免挤占模型与原生特效的包体预算。
 for(const name of config.opaqueJpeg?.files||[]){const sharp=require('../../analysis-work/node_modules/sharp'),file=path.join(output,config.assetDirectory,name),meta=await sharp(file).metadata();if(meta.hasAlpha)throw Error('禁止将透明资源转成JPEG '+name);const target=name.replace(/\.png$/,'.jpg');await sharp(file).jpeg({quality:config.opaqueJpeg.quality,mozjpeg:true}).toFile(path.join(output,config.assetDirectory,target));fs.unlinkSync(file);assetAliases[name]=target;}
 let count=0;
 for(const file of files(path.join(output,config.assetDirectory)).filter(f=>f.endsWith('.png'))){
  try{execFileSync(config.pngquant,[...(config.imageBudget&&path.basename(file).startsWith('battle-')&&path.basename(file)!=='battle-ground.png'?[String(config.imageBudget.modelColors)]:['--quality',config.pngQuality]),'--force','--skip-if-larger','--speed',String(config.pngSpeed),'--output',file,file],{stdio:'pipe'});}catch(error){if(![98,99].includes(error.status))throw error;}
  if(++count%10===0)console.log('PNG 已处理',count);
 }
 fs.writeFileSync(path.join(output,config.assetDirectory,'game.js'),"'use strict';\n// 资源分包入口，资源由 Assets 仓库读取。\n");
 const game=JSON.parse(fs.readFileSync(path.join(output,'game.json'),'utf8'));
 game.subpackages.push({name:config.assetPackage,root:config.assetDirectory+'/'});json('game.json',game);
 fs.writeFileSync(path.join(output,'game.js'),"'use strict';\n// 发布入口仅加载可玩模式，避免打包历史回放依赖。\nrequire('./play/boot');\n");
 fs.writeFileSync(path.join(output,'play/release-config.js'),'module.exports='+JSON.stringify({assetPackage:config.assetPackage,assetAliases})+';\n');
 fs.writeFileSync(path.join(output,'play/app-version.js'),"'use strict';\n/** 构建版本，与上传版本保持一致。 */\nmodule.exports="+JSON.stringify({version:config.version})+';\n');
 await require('./release-script-format.cjs').compact(output,config);
 const all=files(output),size=f=>fs.statSync(f).size;
 const main=all.filter(f=>!game.subpackages.some(p=>path.relative(output,f).split(path.sep).join('/').startsWith(p.root)));
 const report={version:config.version,files:all.length,mainBytes:main.reduce((s,f)=>s+size(f),0),totalBytes:all.reduce((s,f)=>s+size(f),0),pngCount:count,omittedInactiveModelFiles:excluded.size};
 console.log(JSON.stringify(report,null,2));
 if(report.mainBytes>config.maxMainBytes||report.totalBytes>config.maxTotalBytes)throw Error('发布包超出配置的体积上限');
 fs.writeFileSync(path.join(root,'dist/wechat-build.json'),JSON.stringify(report,null,2)+'\n');
}
build().catch(error=>{console.error(error);process.exitCode=1;});
