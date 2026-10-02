'use strict';
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),source=path.join(root,'game');
const config=JSON.parse(fs.readFileSync(process.argv[2]||path.join(__dirname,'wechat-release.config.json'),'utf8'));
const output=path.resolve(root,config.output);
/** 枚举构建产物，用于压缩与包体校验。 */
function files(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);}
/** 写出可审阅的发布配置，避免修改原始素材和开发入口。 */
function json(file,value){fs.writeFileSync(path.join(output,file),JSON.stringify(value,null,2)+'\n');}
/** 按白名单建立独立发布目录；仅允许清理本仓库 dist 下的生成目录。 */
function build(){
 if(!output.startsWith(path.join(root,'dist')+path.sep))throw Error('发布目录必须位于仓库 dist 下');
 execFileSync(config.pngquant,['--version'],{stdio:'pipe'});
 fs.rmSync(output,{recursive:true,force:true});fs.mkdirSync(output,{recursive:true});
 for(const item of [...config.copy,config.assetDirectory])fs.cpSync(path.join(source,item),path.join(output,item),{recursive:true});
 let count=0;
 for(const file of files(path.join(output,config.assetDirectory)).filter(f=>f.endsWith('.png'))){
  try{execFileSync(config.pngquant,['--force','--skip-if-larger','--quality',config.pngQuality,'--speed',String(config.pngSpeed),'--output',file,file],{stdio:'pipe'});}catch(error){if(![98,99].includes(error.status))throw error;}
  if(++count%10===0)console.log('PNG 已处理',count);
 }
 fs.writeFileSync(path.join(output,config.assetDirectory,'game.js'),"'use strict';\n// 资源分包入口，资源由 Assets 仓库读取。\n");
 const game=JSON.parse(fs.readFileSync(path.join(output,'game.json'),'utf8'));
 game.subpackages.push({name:config.assetPackage,root:config.assetDirectory+'/'});json('game.json',game);
 fs.writeFileSync(path.join(output,'game.js'),"'use strict';\n// 发布入口仅加载可玩模式，避免打包历史回放依赖。\nrequire('./play/boot');\n");
 fs.writeFileSync(path.join(output,'play/release-config.js'),'module.exports='+JSON.stringify({assetPackage:config.assetPackage})+';\n');
 const all=files(output),size=f=>fs.statSync(f).size;
 const main=all.filter(f=>!game.subpackages.some(p=>path.relative(output,f).split(path.sep).join('/').startsWith(p.root)));
 const report={version:config.version,files:all.length,mainBytes:main.reduce((s,f)=>s+size(f),0),totalBytes:all.reduce((s,f)=>s+size(f),0),pngCount:count};
 console.log(JSON.stringify(report,null,2));
 if(report.mainBytes>config.maxMainBytes||report.totalBytes>config.maxTotalBytes)throw Error('发布包超出配置的体积上限');
 fs.writeFileSync(path.join(root,'dist/wechat-build.json'),JSON.stringify(report,null,2)+'\n');
}
build();
