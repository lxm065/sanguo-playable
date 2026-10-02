'use strict';
const fs=require('node:fs'),path=require('node:path'),{call}=require('./devtool.cjs');
/** 保存当前真实模拟器画面，不对图像作二次合成。 */
function main(){const name=process.argv[2];if(!/^[a-z0-9-]+$/.test(name||''))throw Error('请输入英文证据文件名');const result=call('simulator_screenshot',{path:path.resolve(__dirname,'../evidence',name+'.jpg')});fs.writeFileSync(path.resolve(__dirname,'../evidence/viewport.json'),JSON.stringify(result));console.log(result);}
main();
