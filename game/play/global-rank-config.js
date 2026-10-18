"use strict";
/** 全服榜公开配置；凭据仅通过共用微信登录会话获取。 */
module.exports={enabled:true,path:'/game/v1/subscriptions/rank',storageKey:'sanguo-global-rank-v1',retryMs:30000,debounceMs:1500,pageSize:6,defaultName:'主公',legacyNamePattern:'^飞镖手([A-F0-9]{6})$',metrics:require('./friend-rank-config').metrics,panel:{width:680,height:1120,rowTop:263,rowGap:85},profileButton:{width:240,height:50,y:-370}};
