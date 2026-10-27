'use strict';
/** 仅放行当前配置的两个 HTTPS 后端接口，不开放下载、WebSocket 或任意域名。 */
function allowed(method,options,config=require('./fortress-backend-config')){return config.enabled&&method==='request'&&String(options?.method||'GET').toUpperCase()==='POST'&&/^https:\/\/[^/]+$/.test(config.baseUrl)&&[config.loginPath,config.syncPath,require("./permanent-unlock-config").path,...Object.keys(require('./global-rank-config').metrics).flatMap(k=>['read','submit','result'].map(a=>require('./global-rank-config').path+'/'+k+'/'+a)),require('./global-rank-config').path+'/profile/update'].some(path=>options.url===config.baseUrl+path);}
module.exports={allowed};
