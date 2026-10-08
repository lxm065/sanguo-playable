return (async()=>{
 const req=GameGlobal[0].require;
 if(sample.effectsQA)throw Error('请先恢复原场景');
 sample.effectsQA={model:view.model,progress:view.progress,page:view.page,mapOffset:view.mapOffset,state:JSON.stringify(view.model.state),saved:JSON.stringify(GameGlobal[0].wx.getStorageSync(config.storageKey))};
 const E=req('play/expedition.js').Expedition,m=new E(config,roster,{read:()=>null,write:()=>{}});req('play/classic-hooks.js').attach(m,roster);
 view.handbook?.close();view.model=m;view.progress=m.progression;view.page='battle';m.state.units[0].slot=2;view.render();
 await req('play/native-effects.js').warm(view);await sample.assets.skeleton('xuchu');
 const uid=m.state.units[0].uid;view.act(()=>m.merge(uid,'same'));
 await new Promise(r=>setTimeout(r,150));
 const effect=view.nativeEffects.find(e=>e.id==='levelup');if(!effect)throw Error('合成后没有升级特效');
 sample.effectsQA.result={upgradedRank:m.state.units[0].star,upgradeSource:effect.id,upgradeFollow:effect.follow===view.actors.get(uid).node};
 const a=view.actors.get(uid),before=JSON.stringify(m.state);req('play/skill-effects.js').ability(view,a,a,{effect:'whirl'});
 await new Promise(r=>setTimeout(r,180));
 Object.assign(sample.effectsQA.result,{whirlSource:view.nativeEffects.some(e=>e.id==='whirlwind'),rotating:view.whirlMotions.has(uid),labelAbsent:!view.root.getComponentsInChildren(cc.Label).some(l=>l.string==='反旋'),gameplayUnchanged:JSON.stringify(m.state)===before});
 await new Promise(r=>setTimeout(r,1100));sample.effectsQA.result.rotationCleaned=!view.whirlMotions.size;
 return sample.effectsQA.result;
})();
