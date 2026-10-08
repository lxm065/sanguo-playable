'use strict';
const c=require('./vip-config').acquire;
/** 获取积分入口只导航到黑市，不播放广告、不改变VIP积分或奖励。 */
function open(v){v.page=c.page;v.fortOffset=c.scrollOffset;v.render();}
module.exports={open};
