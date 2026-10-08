'use strict';
const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const {call}=require('./devtool.cjs'),config=require(process.argv[2]?path.resolve(process.argv[2]):'./hero-vfx-qa.config.json');
/** 执行已知模拟器验收函数，拒绝把运行时异常误当作成功。 */
function evaluate(body){const r=call('automation_evaluate',{'fn-source':'async function(){const g=GameGlobal[0],s=g.__sanguoPlay;if(!s?.ready)throw Error("游戏尚未就绪");const {view,cc,roster}=s;const req=g.require;'+body+'}'});if(!r.success)throw Error(JSON.stringify(r));return r.result;}
/** 在独立内存棋局中录制真实战斗，始终恢复原视图并比对原存档。 */
async function main(){
  const output=path.resolve(__dirname,'..',config.output);fs.mkdirSync(output,{recursive:true});const result={config,screens:[]};
  try{
    result.setup=evaluate(`if(s.vfxReview)throw Error('已有未恢复验收场景');if(view.playing)throw Error('玩家正在战斗，暂不切换');s.vfxReview={model:view.model,progress:view.progress,page:view.page,speed:view.speed,state:JSON.stringify(view.model.state),saved:JSON.stringify(g.wx.getStorageSync(s.config.storageKey))};const E=req('play/expedition.js').Expedition,m=new E(s.config,roster,{read:()=>null,write:()=>{}});req('play/classic-hooks.js').attach(m,roster);m.simulator=(a,e,r,c,seed,scale)=>req('play/expedition-combat.js').simulate(a,e,r,c,seed,scale,m.state.expedition.equipment);m.progression.enter('0-1');const c=${JSON.stringify(config)};m.state.units=c.team.map((heroId,i)=>({uid:i+1,heroId,star:c.star,slot:c.slots[i]}));m.state.nextUid=m.state.units.length+1;m.enemies=()=>c.enemies.map((heroId,i)=>({uid:-i-1,heroId,star:c.star,slot:c.slots[i]}));view.model=m;view.progress=m.progression;view.speed=1;view.page='battle';view.render();await req('play/native-effects.js').warm(view);await Promise.all([...c.team,...c.enemies].map(id=>s.assets.skeleton(id)));return {isolated:true,heroes:c.team.concat(c.enemies),loadedEffects:view.nativeFrames.size};`);
    result.battle=evaluate(`view.start(true);view.speed=${config.speed};s.vfxReview.seen={};s.vfxReview.originalApply=view.apply;view.apply=function(e){s.vfxReview.seen[e.type]=(s.vfxReview.seen[e.type]||0)+1;return s.vfxReview.originalApply.call(this,e);};return {duration:view.replay.duration,result:view.replay.result,eventCount:view.replay.events.length,effects:[...new Set(view.replay.events.map(e=>e.effect).filter(Boolean))]};`);
    const start=Date.now();
    for(let i=0;i<config.captureFrames;i++){
      const time=Date.now(),file=path.join(output,'frame-'+String(i).padStart(3,'0')+'.jpg');
      const screenshot=call('simulator_screenshot',{path:file,quality:65});
      result.screens.push({frame:i,timeMs:Date.now()-start,result:screenshot});
      await new Promise(r=>setTimeout(r,Math.max(0,1000/config.fps-(Date.now()-time))));
    }
    result.runtime=evaluate(`const started=Date.now();view.speed=4;while(view.playing&&Date.now()-started<18000)await new Promise(r=>setTimeout(r,100));return {finished:!view.playing,eventIndex:view.eventIndex,eventCount:view.replay.events.length};`);
  }finally{
    result.restore=evaluate(`const old=s.vfxReview;if(!old)return {restored:false};clearInterval(view.timer);view.timer=null;view.playing=false;req('play/battle-effects.js').clear(view);const nodes=(view.nativeEffects||[]).length;const seen=old.seen;if(old.originalApply)view.apply=old.originalApply;view.model=old.model;view.progress=old.progress;view.page=old.page;view.speed=old.speed;view.render();const unchanged=JSON.stringify(view.model.state)===old.state&&JSON.stringify(g.wx.getStorageSync(s.config.storageKey))===old.saved;delete s.vfxReview;return {restored:true,unchanged,remainingEffects:nodes,seen};`);
    fs.writeFileSync(path.join(output,'qa.json'),JSON.stringify(result,null,2));
  }
  if(!result.runtime.finished||!result.restore.unchanged||result.restore.remainingEffects!==0)throw Error('运行验收或存档恢复未通过');
  const timing=[];
  for(let i=0;i<result.screens.length;i++){
    timing.push("file 'frame-"+String(i).padStart(3,'0')+".jpg'");
    const duration=i+1<result.screens.length?(result.screens[i+1].timeMs-result.screens[i].timeMs)/1000:1/config.fps;
    timing.push('duration '+duration.toFixed(3));
  }
  timing.push("file 'frame-"+String(result.screens.length-1).padStart(3,'0')+".jpg'");
  const timingFile=path.join(output,'capture-timing.txt');fs.writeFileSync(timingFile,timing.join('\n'));
  const encoded=spawnSync(config.ffmpeg,['-y','-f','concat','-safe','0','-i',timingFile,'-vf','scale=360:-2','-vsync','vfr','-c:v','libx264','-pix_fmt','yuv420p',path.join(output,'battle-review.mp4')],{encoding:'utf8',windowsHide:true});
  if(encoded.status!==0)throw Error(encoded.stderr);
  console.log(JSON.stringify({output,battle:result.battle,restore:result.restore}));
}
main().catch(e=>{console.error(e);process.exitCode=1;});
