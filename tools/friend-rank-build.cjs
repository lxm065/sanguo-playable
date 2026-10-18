'use strict';
const fs=require('node:fs'),path=require('node:path');
/** 由主域唯一配置生成 JS 子域入口依赖，微信运行时不 require JSON 或跨域模块。 */
function install(root){const target=path.join(root,'wechat-friend-data');fs.mkdirSync(target,{recursive:true});const badges=require('../game/play/rank-badge-config');badges.files.forEach((file,i)=>{const to=path.join(root,badges.openFiles[i]);fs.mkdirSync(path.dirname(to),{recursive:true});fs.copyFileSync(path.resolve(__dirname,'../game/skin-assets',file),to);});fs.copyFileSync(path.resolve(__dirname,'../game/play/rank-format.js'),path.join(target,'rank-format.js'));fs.writeFileSync(path.join(target,'config.js'),"'use strict';\n/** 由 friend-rank-build.cjs 生成，请修改 play/friend-rank-config.js。 */\nmodule.exports="+JSON.stringify(require('../game/play/friend-rank-config'))+';\n');}
if(require.main===module)install(path.resolve(__dirname,'../game'));
module.exports={install};
