'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
/** 核验最终上传目录与源码、广告配置、兼容配置和预算一致，拒绝带有验收探针的产物。 */
async function verify(){
 const root=path.resolve(__dirname,'..'),config=require('./wechat-release.config.json'),dir=path.resolve(root,config.output),play=path.join(dir,'play'),load=name=>require(path.join(play,name));
 assert.equal(load('app-version').version,config.version);assert.equal(require('../game/play/app-version').version,config.version);
 const project=JSON.parse(fs.readFileSync(path.join(dir,'project.config.json'),'utf8'));require('./wechat-project-policy.cjs').verify(project,config.projectPolicy);
 assert.deepEqual(load('classic-config').ads,require('../game/play/classic.config.json').ads);assert.equal(load('classic-config').ads.mode,'wechat');assert.match(load('classic-config').ads.adUnitId,/^adunit-[a-f0-9]+$/);
 assert.deepEqual(load('play-benefits-config'),require('../game/play/play-benefits-config'));assert(!fs.readdirSync(play).some(name=>name.includes('qa.local')));assert(!fs.readFileSync(path.join(dir,'game.js'),'utf8').includes('qa.local'));
 const files=['ads.js','rewarded-ad-config.js','play-benefits.js','play-benefits-config.js','play-benefits-view.js','classic-view.js','boot.js','classic-config.js','app-version.js'],hashes=[];
 for(const file of files){const source=fs.readFileSync(path.join(root,'game/play',file),'utf8'),expected=await require('./release-script-format.cjs').format(source,config.scriptMinifier),actual=fs.readFileSync(path.join(play,file),'utf8');assert.equal(actual,expected,'源码与生成包不一致：'+file);hashes.push({file,sha256:crypto.createHash('sha256').update(actual).digest('hex')});}
 const bytes={main:0,total:0};const subpackages=JSON.parse(fs.readFileSync(path.join(dir,'game.json'),'utf8')).subpackages;
 /** 重新计算最终生成包大小，避免使用注入临时探针之前的过期预算。 */
 function scan(folder){for(const e of fs.readdirSync(folder,{withFileTypes:true})){const file=path.join(folder,e.name);if(e.isDirectory())scan(file);else{const size=fs.statSync(file).size,relative=path.relative(dir,file).split(path.sep).join('/');bytes.total+=size;if(!subpackages.some(p=>relative.startsWith(p.root)))bytes.main+=size;}}}
 scan(dir);assert(bytes.main<=config.maxMainBytes);assert(bytes.total<=config.maxTotalBytes);
 const report={version:config.version,appid:project.appid,output:dir,passed:true,bytes,files:hashes,verifiedAt:new Date().toISOString()};fs.writeFileSync(path.join(root,'evidence/play-benefits-release-'+config.version+'.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));return report;
}
if(require.main===module)verify().catch(error=>{console.error(error);process.exitCode=1;});module.exports={verify};
