'use strict';
const c=require('./startup-config');
/** 在开场已绘制后下载分包，按下载事件和实际资源完成数报告分阶段进度。 */
async function load(platform,release,assets,roster,intro){
 const weight=release.assetPackage?c.packageWeight:0;
 if(release.assetPackage)await new Promise((resolve,reject)=>{const task=platform.loadSubpackage({name:release.assetPackage,success:resolve,fail:error=>reject(new Error(error.errMsg||'资源分包加载失败'))});task?.onProgressUpdate?.(event=>intro.progress(weight*Math.max(0,Math.min(1,event.progress/100))));});
 intro.progress(weight);let base=0,heroes=0;
 /** 头像、场景和开场骨骼按任务数计入装配进度，不使用虚假计时进度。 */
 function update(){const total=roster.length+2+c.heroes.length,done=base*(roster.length+2)+heroes*c.heroes.length;intro.progress(weight+(c.readyLimit-weight)*done/total);}
 await Promise.all([assets.preload(roster,p=>{base=p;update();}),intro.prepare(assets,p=>{heroes=p;update();})]);
}
module.exports={load};
