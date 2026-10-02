'use strict';
const fs=require('node:fs'),{call}=require('./devtool.cjs');
/** 从文件传入测试表达式，避免 PowerShell/cmd 破坏 JS 字符串。 */
function main(){
 const source=fs.readFileSync(process.argv[2],'utf8');
 const result=call('automation_evaluate',{'fn-source':'function(){const sample=GameGlobal[0].__sanguoPlay;const {cc,model,view,config,roster}=sample;'+source+'}'});
 if(process.argv[3])fs.writeFileSync(process.argv[3],JSON.stringify(result,null,2));else console.log(JSON.stringify(result,null,2));
}
main();
