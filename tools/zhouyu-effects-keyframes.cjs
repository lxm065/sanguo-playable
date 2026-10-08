'use strict';
const fs=require('node:fs'),path=require('node:path'),{call}=require('./devtool.cjs');
const config=require('./zhouyu-effects-qa.config.json');
/** 在已启动的小游戏中执行固定验收片段，拒绝隐藏运行时异常。 */
function evaluate(body){const r=call('automation_evaluate',{'fn-source':'async function(){const g=GameGlobal[0],s=g.__sanguoPlay;if(!s?.ready)throw Error("游戏未就绪");const {view,cc,roster}=s,req=g.require;'+body+'}'});if(!r.success)throw Error(JSON.stringify(r));return r.result;}
/** 使用真实战报逐技冻结关键帧，始终恢复导演时钟、原视图及玩家存档。 */
function main(){
  const output=path.resolve(__dirname,'..',config.output),result={shots:[]};fs.mkdirSync(output,{recursive:true});
  try{
    evaluate(`if(view.playing||s.zhouyuQA)throw Error('当前场景不可切换');s.zhouyuQA={model:view.model,progress:view.progress,page:view.page,speed:view.speed,apply:view.apply,state:JSON.stringify(view.model.state),saved:JSON.stringify(g.wx.getStorageSync(s.config.storageKey)),seen:[],paused:false};const E=req('play/expedition.js').Expedition,m=new E(s.config,roster,{read:()=>null,write:()=>{}});req('play/classic-hooks.js').attach(m,roster);m.simulator=(a,e,r,c,seed,scale)=>req('play/expedition-combat.js').simulate(a,e,r,c,seed,scale,m.state.expedition.equipment);m.progression.enter('0-1');const c=${JSON.stringify(config)};m.state.units=c.team.map((heroId,i)=>({uid:i+1,heroId,star:c.star,slot:c.slots[i]}));m.state.nextUid=4;m.enemies=()=>c.enemies.map((heroId,i)=>({uid:-i-1,heroId,star:c.star,slot:c.slots[i]}));view.model=m;view.progress=m.progression;view.speed=1;view.page='battle';view.render();await req('play/native-effects.js').warm(view);await Promise.all([...c.team,...c.enemies].map(id=>s.assets.skeleton(id)));view.start(true);const q=s.zhouyuQA;q.totalEvents=view.replay.events.length;q.capture={firePillar:{type:'damage',wait:.3},flameWave:{type:'ability',wait:s.config.attackDelay*.45},lightning:{type:'damage',wait:.12}};view.apply=function(e){q.apply.call(this,e);const p=q.capture[e.effect];if(p&&e.type===p.type&&!q.seen.includes(e.effect)&&!q.holdTimer){q.holdTimer=setTimeout(()=>{q.holdTimer=null;q.current=e.effect;q.event=e;q.seen.push(e.effect);view.speed=0;cc.director.pause();q.paused=true;},p.wait*1000);}};return {ready:true};`);
    for(let i=0;i<Object.keys({firePillar:1,flameWave:1,lightning:1}).length;i++){
      const shot=evaluate(`const q=s.zhouyuQA,start=Date.now();while(!q.paused&&view.playing&&Date.now()-start<14000)await new Promise(r=>setTimeout(r,40));if(!q.paused)throw Error('未捕获全部技能');return {effect:q.current,event:q.event,nodes:(view.nativeEffects||[]).filter(e=>e.node.isValid).map(e=>({id:e.id,x:e.node.position.x,y:e.node.position.y})),beamCount:view.zhouyuBeams?.size||0};`);
      shot.screenshot=call('simulator_screenshot',{path:path.join(output,shot.effect+'-keyframe.jpg'),quality:90});result.shots.push(shot);
      evaluate('s.zhouyuQA.paused=false;view.speed=1;cc.director.resume();return true;');
    }
  }finally{
    result.restore=evaluate(`const q=s.zhouyuQA;if(!q)return {restored:false};clearTimeout(q.holdTimer);clearInterval(view.timer);view.timer=null;view.playing=false;cc.director.resume();req('play/battle-effects.js').clear(view);view.apply=q.apply;view.model=q.model;view.progress=q.progress;view.page=q.page;view.speed=q.speed;view.render();const unchanged=JSON.stringify(view.model.state)===q.state&&JSON.stringify(g.wx.getStorageSync(s.config.storageKey))===q.saved;delete s.zhouyuQA;return {restored:true,unchanged};`);
    fs.writeFileSync(path.join(output,'keyframe-review.json'),JSON.stringify(result,null,2));
  }
  if(!result.restore.unchanged)throw Error('玩家存档比对失败');
  console.log(JSON.stringify({effects:result.shots.map(s=>s.effect),restore:result.restore}));
}
main();
