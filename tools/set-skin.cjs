'use strict';
const fs=require('node:fs'),path=require('node:path');
/** 修改单一外观开关；重新编译后由同一录制启动，数值和存档均不迁移。 */
function main(){
 const mode=process.argv[2];if(!['on','off'].includes(mode))throw Error('用法: node tools/set-skin.cjs on|off');
 const file=path.resolve(__dirname,'../game/skin.config.js'),text=fs.readFileSync(file,'utf8');
 if((text.match(/enabled: (true|false),/g)||[]).length!==1)throw Error('开关定位不唯一');
 fs.writeFileSync(file,text.replace(/enabled: (true|false),/,'enabled: '+(mode==='on')+','));
 console.log('换皮 '+mode+'；请等待开发者工具编译完成。');
}
main();
