const {call}=require('./devtool.cjs'),fs=require('node:fs');
/** 隔离场景的运行时检查入口，预览结束始终恢复棋局和存档。 */
const evalCode=body=>call('automation_evaluate',{'fn-source':'async function(){const g=GameGlobal[0],s=g.__sanguoPlay,{view,cc,roster}=s,req=g.require;'+body+'}'});
const result={};
try{
 result.setup=evalCode(`if(view.playing||s.bondReview)throw Error('当前场景不可切换');s.bondReview={model:view.model,progress:view.progress,page:view.page,state:JSON.stringify(view.model.state),saved:JSON.stringify(g.wx.getStorageSync(s.config.storageKey))};const E=req('play/expedition.js').Expedition,m=new E(s.config,roster,{read:()=>null,write:()=>{}});req('play/classic-hooks.js').attach(m,roster);m.progression.enter('0-1');m.state.units=[{uid:1,heroId:'xuchu',star:2,slot:18},{uid:2,heroId:'xuchu',star:2,slot:19},{uid:3,heroId:'zhenji',star:2,slot:24},{uid:4,heroId:'huangzhong',star:2,slot:25}];view.model=m;view.progress=m.progression;view.page='battle';view.render();await Promise.all(m.state.units.map(u=>s.assets.skeleton(u.heroId)));const fx=req('play/bond-trigger-view.js');await fx.warm(view);await fx.show(view,[]);return {animations:(await fx.load(view)).getRuntimeData().animations.map(a=>({name:a.name,duration:a.duration})),nodes:view.bondTriggerNodes.map(n=>n.name)};`);
 result.runtime=evalCode(`cc.TweenSystem.instance.update(.01);cc.TweenSystem.instance.update(.01);for(const n of view.bondTriggerNodes||[]){const sk=n.isValid&&n.getComponent(cc.sp.Skeleton);if(sk){sk.updateAnimation(.65);sk.timeScale=0;}}cc.director.root.frameMove(0);return {deterministicPoseSeconds:.65,effects:(view.bondTriggerNodes||[]).filter(n=>n.isValid).map(n=>({name:n.name,animation:n.getComponent(cc.sp.Skeleton)?.animation})),paused:cc.game.isPaused()};`);
 result.screenshot=call('simulator_screenshot',{path:process.cwd()+'/evidence/bond-trigger-preview.png'});
}finally{
 result.restore=evalCode(`const old=s.bondReview;if(!old)return {restored:false};req('play/bond-trigger-view.js').clear(view);view.model=old.model;view.progress=old.progress;view.page=old.page;view.render();const unchanged=old.state===JSON.stringify(view.model.state)&&old.saved===JSON.stringify(g.wx.getStorageSync(s.config.storageKey));delete s.bondReview;return {restored:true,unchanged};`);fs.writeFileSync('evidence/bond-trigger-runtime.json',JSON.stringify(result,null,2));
}
console.log(JSON.stringify(result));
