'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const environment=JSON.parse(fs.readFileSync(path.join(__dirname,'local.environment.json'),'utf8'));
const home=environment.wechatHome;
/** 直接调用已安装 CLI 的入口，避免 cmd 对代码中的引号与管道再次解析。 */
function call(tool,options={}){
 const args=['-c',environment.clientName,tool,'--project',path.resolve(__dirname,'../game')];
 for(const [k,v] of Object.entries(options))args.push('--'+k,typeof v==='string'?v:JSON.stringify(v));
 const script=path.join(home,'resources/app.asar.unpacked/js/common/cli/skill-index.js');
 const bootstrap="const e=process.argv[1],a=process.argv.slice(2);process.env.cwd=process.cwd();process.argv=[process.execPath,e,'--electron'].concat(a);require(e)";
 const result=spawnSync(path.join(home,'微信开发者工具.exe'),['-e',bootstrap,script,...args],{env:{...process.env,ELECTRON_RUN_AS_NODE:'1'},encoding:'utf8',windowsHide:true,timeout:45000,maxBuffer:8*1024*1024});
 if(result.error)throw result.error;
 const text=result.stdout;const start=text.indexOf('{');if(start<0)throw Error(result.stderr||text);
 const parsed=JSON.parse(text.slice(start));if(!parsed.ok)throw Error(JSON.stringify(parsed));return parsed.result;
}
if(require.main===module){
 const tool=process.argv[2],options=process.argv[3]?JSON.parse(fs.readFileSync(process.argv[3],'utf8')):{};
 const result=call(tool,options);
 if(process.argv[4])fs.writeFileSync(process.argv[4],JSON.stringify(result,null,2));
 else console.log(JSON.stringify(result,null,2));
}
module.exports={call};
