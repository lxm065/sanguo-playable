"use strict";
/** 播报资源、音量和连杀窗口独立于数值演算；使用战斗时间判断连杀。 */
const announcements=require('./announcer-config');
module.exports={enabled:true,killSide:'ally',volume:0.65,obeyMuteSwitch:true,windowSeconds:8,root:'skin-assets/audio/',maxQueue:2,maxKillTier:Math.max(...Object.keys(announcements).map(Number).filter(Number.isFinite)),clips:Object.fromEntries(Object.entries(announcements).map(([key,entry])=>[key,entry.clip]))};
