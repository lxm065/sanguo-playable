'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),game=path.resolve(root,require('./wechat-release.config.json').output),env=require('./local.environment.json'),data=path.join(process.env.LOCALAPPDATA,'微信开发者工具/User Data');
const profiles=fs.readdirSync(data).map(p=>path.join(data,p)).filter(p=>fs.existsSync(path.join(p,'Default/.ide'))),profile=profiles.sort((a,b)=>fs.statSync(path.join(b,'Default/.ide')).mtimeMs-fs.statSync(path.join(a,'Default/.ide')).mtimeMs)[0],port=fs.readFileSync(path.join(profile,'Default/.ide'),'utf8').trim();
const runID=Date.now().toString(),filename='quiet-'+runID+'.json',output=path.join(root,'evidence/battle-refresh-301-engine-'+runID),entry=path.join(game,'game.js'),probe=path.join(game,'play/battle-refresh-301-qa.local.js'),original=fs.readFileSync(entry),injected=Buffer.from("require('./play/battle-refresh-301-qa.local').start(wx,"+JSON.stringify(runID)+");\n");
/** 所有自动化走安装包的官方 CLI，辅助进程隐藏并限制运行时间。 */
function invoke(script,args){const boot="const e=process.argv[1],a=process.argv.slice(2);process.env.cwd=process.cwd();process.argv=[process.execPath,'--ms-enable-electron-run-as-node',e,'--electron'].concat(a);require(e)";const result=cp.spawnSync(path.join(env.wechatHome,'微信开发者工具.exe'),['-e',boot,path.join(env.wechatHome,'resources/app.asar.unpacked/js/common/cli',script),...args],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,encoding:'utf8',timeout:60000});if(result.error)throw result.error;if(result.status!==0)throw Error(result.stdout+result.stderr);return result.stdout+result.stderr;}
/** 只开关这次生成的发布目录，不操作其他项目。 */
function cli(action){console.log(invoke('index.js',[action,'--project',game,'--port',port]));}
/** 按唯一报告名寻找本次测试文件，不读取任何玩家存档。 */
function find(dir){if(!fs.existsSync(dir))return null;for(const item of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory()){const hit=find(p);if(hit)return hit;}else if(item.name===filename)return p;}return null;}
/** 临时入口精确匹配后恢复，保存恢复后的摘要以便上传前核对。 */
function restore(){if(fs.readFileSync(entry).equals(injected))fs.writeFileSync(entry,original);else if(!fs.readFileSync(entry).equals(original))throw Error('入口已被外部修改，拒绝覆盖');if(fs.existsSync(probe))fs.unlinkSync(probe);fs.writeFileSync(path.join(output,'restored.json'),JSON.stringify({restored:fs.readFileSync(entry).equals(original),entrySha256:crypto.createHash('sha256').update(original).digest('hex'),probeAbsent:!fs.existsSync(probe)},null,2));}
/** 整体有界运行，成功或失败都恢复入口；验收入口从未启动真实账号。 */
async function run(){
 if(!game.startsWith(path.join(root,'dist')+path.sep)||fs.existsSync(probe))throw Error('验收路径无效或已有临时探针');fs.mkdirSync(output,{recursive:true});fs.writeFileSync(path.join(output,'entry-backup.js'),original);cli('close');
 fs.copyFileSync(path.join(__dirname,'battle-refresh-301-runtime-probe.js'),probe);fs.writeFileSync(entry,injected);
 try{cli('open');const deadline=Date.now()+240000;let file,lastPhase;
  while(Date.now()<deadline){file=file||find(path.join(profile,'WeappSimulator'));if(file){let report;try{report=JSON.parse(fs.readFileSync(file,'utf8'));}catch{}
   if(report){if(report.phase!==lastPhase){lastPhase=report.phase;console.log('PHASE '+lastPhase);}
    if(['passed','failed'].includes(report.phase)){fs.copyFileSync(file,path.join(output,'report.json'));for(const screen of report.screens)fs.copyFileSync(path.join(path.dirname(file),screen.file),path.join(output,screen.file));console.log(JSON.stringify(report,null,2));console.log('EVIDENCE '+output);if(report.phase!=='passed')process.exitCode=1;return;}
   }}await new Promise(r=>setTimeout(r,1500));
  }throw Error('未收到模拟器验收报告');
 }finally{try{cli('close');}finally{restore();}}
}
run().catch(error=>{console.error(error);process.exitCode=1;});
