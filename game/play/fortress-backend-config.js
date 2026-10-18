'use strict';
/** 仅公开连接参数；完成后台范围、迁移与部署验证后才启用，不存储 AppSecret。 */
module.exports={enabled:true,baseUrl:'https://jtd.beexm.com',gameIdentifier:'sanguo_playable',loginPath:'/game/v1/subscriptions/session/login',syncPath:'/game/v1/subscriptions/fortress',timeoutMs:10000,retryMs:30000};
