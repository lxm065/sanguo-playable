"use strict";
const c=require('./combat-feedback-config').banner;
/** 清除上一次横幅及动画，避免连续击杀堆叠遮挡棋盘。 */
function clear(v){const n=v.killBanner;if(n?.isValid){v.cc.Tween.stopAllByTarget(n);const o=n.getComponent(v.cc.UIOpacity);if(o)v.cc.Tween.stopAllByTarget(o);n.destroy();}v.killBanner=null;}
/** 使用原版金色横幅、击杀图案和双方武将头像播放弹入淡出动画。 */
function show(v,info){if(!info||info.count>c.maxCount)return;clear(v);const u=v.ui,cc=v.cc,n=u.node(v.root,'kill-banner',0,c.y);v.killBanner=n;u.image(n,'feedback/background.png',0,0,c.width,c.height);for(const [unit,x,frame]of [[info.killer,-c.portraitX,'attacker'],[info.victim,c.portraitX,'victim']]){const p=u.node(n,'kill-portrait',x,0,c.portraitSize,c.portraitSize);p.addComponent(cc.Mask).type=cc.Mask.Type.ELLIPSE;u.image(p,unit.heroId+'-avatar.png',0,0,c.portraitSize,c.portraitSize);u.image(n,'feedback/'+frame+'.png',x,0,c.frameSize,c.frameSize);}u.image(n,'feedback/'+info.count+'.png',0,0,c.textWidth,c.textHeight);n.setScale(.25,.25,1);const opacity=n.addComponent(cc.UIOpacity);cc.tween(n).to(c.enter,{scale:new cc.Vec3(1.08,1.08,1)}).to(c.settle,{scale:new cc.Vec3(1,1,1)}).start();cc.tween(opacity).delay(c.enter+c.settle+c.hold).to(c.fade,{opacity:0}).call(()=>{if(n.isValid)n.destroy();if(v.killBanner===n)v.killBanner=null;}).start();}
/** 备战期间预载小型横幅图片，首次击杀不等待解码。 */
function warm(v){for(const file of ["background","attacker","victim",...Array.from({length:c.maxCount},(_,i)=>String(i+1))])v.assets.sprite("feedback/"+file+".png").catch(()=>{});}
module.exports={show,clear,warm};
