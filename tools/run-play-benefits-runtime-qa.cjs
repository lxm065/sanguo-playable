'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),game=path.resolve(root,require('./wechat-release.config.json').output),entry=path.join(game,'game.js'),probe=path.join(game,'play/play-benefits-runtime-qa.local.js');
const env=require('./local.environment.json'),qa=require('./play-benefits-qa.config.json'),dataRoot=path.join(process.env.LOCALAPPDATA,'微信开发者工具/User Data');
const profiles=fs.readdirSync(dataRoot).map(name=>path.join(dataRoot,name)).filter(dir=>fs.existsSync(path.join(dir,'Default/.ide'))),profile=env.qaProfile||profiles.sort((a,b)=>fs.statSync(path.join(b,'Default/.ide')).mtimeMs-fs.statSync(path.join(a,'Default/.ide')).mtimeMs)[0],port=fs.readFileSync(path.join(profile,'Default/.ide'),'utf8').trim();
const runID=new Date().toISOString().replace(/[^0-9]/g,''),reportName='quiet-'+runID+'.json',original=fs.readFileSync(entry),injected=Buffer.from(original.toString()+"\nrequire('./play/play-benefits-runtime-qa.local').start(wx,"+JSON.stringify(runID)+","+JSON.stringify(qa)+");\n");
const output=path.join(root,'evidence/play-benefits-runtime-'+runID);fs.mkdirSync(output,{recursive:true});let reportPath,lastCapture=-1;
/** 按官方 CLI 的 Electron 入口执行，隐藏辅助窗口，不传登录票据。 */
function invoke(script,args){const prefix=script==='skill-index.js'?"[process.execPath,e,'--electron']":"[process.execPath,'--ms-enable-electron-run-as-node',e,'--electron']",bootstrap="const e=process.argv[1],a=process.argv.slice(2);process.env.cwd=process.cwd();process.argv="+prefix+".concat(a);require(e)";const result=cp.spawnSync(path.join(env.wechatHome,'微信开发者工具.exe'),['-e',bootstrap,path.join(env.wechatHome,'resources/app.asar.unpacked/js/common/cli',script),...args],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},windowsHide:true,encoding:'utf8',timeout:qa.readyTimeoutMs});if(result.error)throw result.error;if(result.status!==0)throw Error(result.stdout+result.stderr);return result.stdout;}
/** 打开和关闭范围只限当前生成包工程。 */
function cli(args){console.log(invoke('index.js',[...args,'--port',port,'--project',game]));}
/** 在当前工具沙盒按唯一报告名查找，不读取其他玩家文件内容。 */
function find(dir){if(!fs.existsSync(dir))return null;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){const found=find(p);if(found)return found;}else if(e.name===reportName)return p;}return null;}
/** 输出官方模拟器截图并核对大小，避免将空白缩略图计为验收。 */
function capture(file){const result=invoke('skill-index.js',['-c',env.clientName,'simulator_screenshot','--project',game,'--path',file,'--quality','90']);const start=result.indexOf('{');if(start<0||!JSON.parse(result.slice(start)).ok)throw Error(result);return fs.existsSync(file)&&fs.statSync(file).size>=qa.minScreenshotBytes;}
/** 只恢复本任务精确写入的入口，出现外部修改时拒绝覆盖。 */
function restore(){if(fs.readFileSync(entry).equals(injected))fs.writeFileSync(entry,original);else if(!fs.readFileSync(entry).equals(original))throw Error('生成入口被外部修改，未覆盖');if(fs.existsSync(probe))fs.unlinkSync(probe);}
/** 运行独立验收，完成后还原临时探针，保证上传目录只包含产品代码。 */
async function run(){
 if(fs.existsSync(probe))throw Error('存在未核对的临时探针');fs.writeFileSync(path.join(output,'entry-backup.js'),original);cli(['close']);
 fs.copyFileSync(path.join(__dirname,'play-benefits-runtime-probe.js'),probe);fs.writeFileSync(entry,injected);
 try{cli(['open']);const end=Date.now()+qa.runnerTimeoutMs;while(Date.now()<end){
  reportPath=reportPath||find(path.join(profile,'WeappSimulator'));
  if(reportPath){let report;try{report=JSON.parse(fs.readFileSync(reportPath,'utf8'));}catch{}
   if(report?.phase==='capture-ready'&&lastCapture!==report.captureIndex){const index=report.captureIndex;if(capture(path.join(output,'frame-'+String(index).padStart(3,'0')+'.jpg'))){lastCapture=index;fs.writeFileSync(path.join(path.dirname(reportPath),'quiet-'+runID+'-capture-'+lastCapture+'.ack'),'ok');}}
   if(report&&['passed','failed'].includes(report.phase)){fs.copyFileSync(reportPath,path.join(output,'report.json'));console.log('RUNTIME_EVIDENCE '+output);console.log(JSON.stringify(report,null,2));if(report.phase!=='passed')process.exitCode=1;return;}
  }await new Promise(resolve=>setTimeout(resolve,qa.runnerPollMs));
 }throw Error('模拟器验收超时');}finally{try{cli(['close']);}finally{restore();}}
}
run().catch(error=>{console.error(error.stack);process.exitCode=1;});
