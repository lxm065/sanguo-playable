'use strict';
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
const root=path.resolve(__dirname,'..'),game=path.join(root,'game'),entry=path.join(game,'game.js'),probe=path.join(game,'play/solo-challenge-runtime-qa.local.js');
const env=require('./local.environment.json'),dataRoot=path.join(process.env.LOCALAPPDATA,'微信开发者工具/User Data');
const profiles=fs.readdirSync(dataRoot).map(name=>path.join(dataRoot,name)).filter(dir=>fs.existsSync(path.join(dir,'Default/.ide')));
const profile=env.qaProfile||profiles.sort((a,b)=>fs.statSync(path.join(b,'Default/.ide')).mtimeMs-fs.statSync(path.join(a,'Default/.ide')).mtimeMs)[0],port=fs.readFileSync(path.join(profile,'Default/.ide'),'utf8').trim();
const runID=new Date().toISOString().replace(/[^0-9]/g,''),reportName='quiet-'+runID+'.json',original=fs.readFileSync(entry),injected=Buffer.from(original.toString()+"\nrequire('./play/solo-challenge-runtime-qa.local').start(wx,"+JSON.stringify(runID)+");\n");
const output=path.join(root,'evidence/solo-runtime-'+runID);fs.mkdirSync(output,{recursive:true});
let reportPath=null,lastPhase='';
/** 只在当前工具的模拟器沙盒寻找本次唯一报告，不读取其他玩家文件。 */
function findReport(dir){if(!fs.existsSync(dir))return null;for(const e of fs.readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory()){const found=findReport(p);if(found)return found;}else if(e.name===reportName)return p;}return null;}
/** 调用既有官方CLI，不传登录票据，不修改工具安全设置。 */
function cli(args){const result=cp.spawnSync(path.join(env.wechatHome,'node.exe'),[path.join(env.wechatHome,'cli.js'),...args,'--port',port,'--project',game],{windowsHide:true,encoding:'utf8',timeout:120000});console.log((result.stdout||'')+(result.stderr||''));if(result.error)throw result.error;}
/** 临时入口有精确比对保护，不覆盖测试过程中其他人的改动。 */
function restore(){if(fs.existsSync(entry)&&fs.readFileSync(entry).equals(injected))fs.writeFileSync(entry,original);else if(!fs.readFileSync(entry).equals(original))console.error('入口已被其他操作修改，未覆盖，请检查临时 require');if(fs.existsSync(probe))fs.unlinkSync(probe);}
/** 等待实际引擎输出，拷贝报告及其截图后自动恢复开发入口。 */
async function run(){
 if(fs.existsSync(probe))throw Error('已有临时探针，先核对来源');
 fs.writeFileSync(path.join(output,'entry-backup.js'),original);cli(['close']);await new Promise(resolve=>setTimeout(resolve,1000));
 fs.copyFileSync(path.join(__dirname,'solo-challenge-runtime-probe.js'),probe);fs.writeFileSync(entry,injected);
 try{
  cli(['open']);
  const deadline=Date.now()+180000;
  while(Date.now()<deadline){
   reportPath=reportPath||findReport(path.join(profile,'WeappSimulator'));
   if(reportPath){let report;try{report=JSON.parse(fs.readFileSync(reportPath,'utf8'));}catch{}
    if(report){if(report.phase!==lastPhase){lastPhase=report.phase;console.log('RUNTIME_PHASE '+lastPhase);}
     if(['passed','failed','watchdog-restored'].includes(report.phase)){
      fs.copyFileSync(reportPath,path.join(output,'report.json'));
      for(const screen of report.screens||[]){const name=path.basename(screen.file);fs.copyFileSync(path.join(path.dirname(reportPath),name),path.join(output,name));}
      console.log('RUNTIME_EVIDENCE '+output);console.log(JSON.stringify(report,null,2));if(report.phase!=='passed')process.exitCode=1;return;
     }
    }
   }
   await new Promise(resolve=>setTimeout(resolve,2000));
  }
  throw Error('模拟器没有在限定时间生成完成报告');
 }finally{try{cli(['close']);}finally{restore();}}
}
run().catch(error=>{console.error(error.message);process.exitCode=1;});
