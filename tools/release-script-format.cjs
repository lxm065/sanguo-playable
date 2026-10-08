'use strict';
const fs=require('node:fs'),path=require('node:path');
/** 仅格式压缩，不启用优化或变量改名，保留函数名、模块边界和全部业务表达式。 */
async function format(source,modulePath){return (await require(modulePath).minify(source,{compress:false,mangle:false,keep_fnames:true,keep_classnames:true,format:{comments:false}})).code+'\n';}
/** 只处理发布副本的业务脚本，源文件及引擎脚本保持原样。 */
async function compact(output,config){if(!config.scriptMinifier)return;const dir=path.join(output,'play');for(const name of fs.readdirSync(dir).filter(n=>n.endsWith('.js'))){const file=path.join(dir,name);fs.writeFileSync(file,await format(fs.readFileSync(file,'utf8'),config.scriptMinifier));}}
module.exports={format,compact};
