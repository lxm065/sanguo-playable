'use strict';
/** 精确放行配置的账号、存档、排行榜和提醒接口，不开放任意域名或路径。 */
function allowed(method,options,config=require('./fortress-backend-config')){
 const rank=require('./global-rank-config'),cloud=require('./cloud-save-config');
 const paths=[config.loginPath,config.syncPath,require('./permanent-unlock-config').path,...Object.keys(rank.metrics).flatMap(key=>['read','submit','result'].map(action=>rank.path+'/'+key+'/'+action)),rank.path+'/profile/update',...(cloud.enabled?['read','commit','heartbeat'].map(action=>cloud.path+'/'+action):[])];
 return config.enabled&&method==='request'&&String(options?.method||'GET').toUpperCase()==='POST'&&/^https:\/\/[^/]+$/.test(config.baseUrl)&&paths.some(path=>options.url===config.baseUrl+path);
}
module.exports={allowed};
