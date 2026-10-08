"use strict";
/** 截图确认的四个档位；周期由原服务器下发，本地采用北京时间周一零点重置。 */
module.exports={targets:[5,10,15,20],star:4,free:{'1':1000},treasure:{'103':20},periodMs:7*24*60*60*1000,anchor:Date.UTC(2026,0,4,16),source:'5/10/15/20档位及1000钻、20随机碎片来自截图；每周一重置为本地策略，未增加未核验档位。',layout:{width:665,height:1050,titleY:467,bannerY:330,bannerHeight:190,viewportY:-120,viewportHeight:680,rowHeight:196,rowGap:204,cardWidth:596,font:28,icon:86}};
