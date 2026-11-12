'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto'),root=path.resolve(__dirname,'..'),config=require('./wechat-release.config.json');
/** 发布前验证实际副本与本次源码、引擎报告和构建包体一致，拒绝上传临时验收入口。 */
async function verify(){
 const output=path.resolve(root,config.output),version=require('../game/play/app-version').version,generated=require(path.join(output,'play/app-version')).version,project=JSON.parse(fs.readFileSync(path.join(output,'project.config.json'),'utf8'));
 assert.equal(version,'1.0.301');assert.equal(config.version,version);assert.equal(generated,version);assert.equal(project.appid,config.projectPolicy.appid);
 const names=['battle-refresh','interaction-performance-config','classic-view','expedition-view','expedition-header','battle-hud','reserve-refresh','team-equipment-buffs'];
 const hashes={};for(const name of names){const code=await require('./release-script-format.cjs').format(fs.readFileSync(path.join(root,'game/play',name+'.js'),'utf8'),config.scriptMinifier),built=fs.readFileSync(path.join(output,'play',name+'.js'),'utf8');assert.equal(built,code,name+' 不是当前源码构建');hashes[name]=crypto.createHash('sha256').update(built).digest('hex');}
 const evidence=path.join(root,'evidence'),latest=fs.readdirSync(evidence).filter(n=>n.startsWith('battle-refresh-301-engine-')).sort().at(-1),engine=JSON.parse(fs.readFileSync(path.join(evidence,latest,'report.json'),'utf8')),restored=JSON.parse(fs.readFileSync(path.join(evidence,latest,'restored.json'),'utf8'));
 assert.equal(engine.phase,'passed');assert.equal(engine.version,version);assert(engine.cases.every(r=>r.renders===0&&r.writes===1));assert(restored.restored&&restored.probeAbsent);assert(!fs.existsSync(path.join(output,'play/battle-refresh-301-qa.local.js')));assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(output,'game.js'))).digest('hex'),restored.entrySha256);
 const build=JSON.parse(fs.readFileSync(path.join(root,'dist/wechat-build.json'),'utf8'));assert.equal(build.version,version);assert(build.mainBytes<=config.maxMainBytes&&build.totalBytes<=config.maxTotalBytes);
 const report={version,appid:project.appid,output,sourceHashes:hashes,build,engineEvidence:latest,engineCases:engine.cases,entryRestored:true,temporaryProbeAbsent:true};fs.writeFileSync(path.join(evidence,'battle-refresh-301-delivery.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
