'use strict';
const fs=require('node:fs'),path=require('node:path');
/** 由主域唯一配置生成 JS 子域入口依赖，微信运行时不 require JSON 或跨域模块。 */
function install(root){const target=path.join(root,'wechat-friend-data');fs.mkdirSync(target,{recursive:true});fs.writeFileSync(path.join(target,'config.js'),"'use strict';\n/** 由 friend-rank-build.cjs 生成，请修改 play/friend-rank-config.js。 */\nmodule.exports="+JSON.stringify(require('../game/play/friend-rank-config'))+';\n');}
if(require.main===module)install(path.resolve(__dirname,'../game'));
module.exports={install};
