'use strict';
/** 在播放中切换配置倍速；切换前的时间按旧速度累计，不重播或更改战果。 */
function cycle(v){
 if(!v.playing)return false;
 const policy=require('./battle-speed-policy');
 if(!policy.unlocked(v.host.model)){v.dialog(policy.config.lockedLabel,policy.config.lockedMessage);return false;}
 const now=Date.now();v.elapsed+=(now-v.lastTime)/1000*v.speed;v.lastTime=now;
 const options=v.config.speedOptions;
 v.speed=options[(options.indexOf(v.speed)+1)%options.length];
 v.speedLabel.string='速度 ×'+v.speed;
 return true;
}
module.exports={cycle};
