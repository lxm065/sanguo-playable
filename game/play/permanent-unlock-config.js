'use strict';
/** 后台永久权益协议；配置项是支持的奖励类型，不向任何账号默认授予。 */
module.exports={enabled:true,path:'/game/v1/subscriptions/unlocks/sync',retryMs:60000,
 items:{hero_zhurong:{kind:'heroes',id:'zhurong',name:'祝融'},lord_sunjian:{kind:'lords',id:'1002',name:'孙坚'},lord_liubiao:{kind:'lords',id:'1007',name:'刘表'}},
 text:'后台奖励已到账：'};
