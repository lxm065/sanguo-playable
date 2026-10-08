const original={model:view.model,progress:view.progress,page:view.page,mapOffset:view.mapOffset,equipmentPage:view.equipmentPage,state:JSON.stringify(view.model.state),saved:JSON.stringify(GameGlobal[0].wx.getStorageSync(config.storageKey))};
const req=GameGlobal[0].require,results={};
try{
 if(!view.scrollArea.toString().includes('scroll-gesture'))throw Error('尚未载入修改代码');
 const E=req('play/expedition.js').Expedition,m=new E(config,roster,{read:()=>null,write:()=>{}});req('play/classic-hooks.js').attach(m,roster);
 const c=req('play/battle-hud-config.js').equipment;m.state.expedition.equipment=Array.from({length:c.columns*c.rows+1},(_,i)=>({uid:i+1,id:'7202',owner:null}));
 view.handbook?.close();view.model=m;view.progress=m.progression;view.page='battle';view.render();
 const actors=[...view.actors],first=view.root.getChildByName('equipment-inventory');
 if(!first)throw Error('没有装备容器');
 first.getChildByName('›').emit(cc.Node.EventType.TOUCH_END,{});
 results.page=view.equipmentPage;results.actorsRetained=actors.every(([id,a])=>view.actors.get(id)===a&&a.node.isValid);results.panelReplaced=view.root.getChildByName('equipment-inventory')!==first;
 if(results.page!==1||!results.actorsRetained||!results.panelReplaced)throw Error('翻页验证失败');
 view.page='map';view.mapOffset=0;view.render();
 const viewport=view.root.getChildByName('route-scroll'),content=viewport.getChildByName('content'),event=(x,y)=>({getUILocation:()=>({x,y})});
 viewport.emit(cc.Node.EventType.TOUCH_START,event(100,100));viewport.emit(cc.Node.EventType.TOUCH_MOVE,event(103,96));results.jitterIsTap=!view.mapDragged&&content.position.y===0;
 viewport.emit(cc.Node.EventType.TOUCH_MOVE,event(100,50));results.swipeIsDrag=view.mapDragged;viewport.emit(cc.Node.EventType.TOUCH_END,event(100,50));
 viewport.emit(cc.Node.EventType.TOUCH_START,event(100,50));results.nextTapReset=!view.mapDragged;
 if(!results.jitterIsTap||!results.swipeIsDrag||!results.nextTapReset)throw Error('地图手势验证失败');
}finally{view.model=original.model;view.progress=original.progress;view.page=original.page;view.mapOffset=original.mapOffset;view.equipmentPage=original.equipmentPage;view.render();results.modelUnchanged=original.state===JSON.stringify(view.model.state);results.storageUnchanged=original.saved===JSON.stringify(GameGlobal[0].wx.getStorageSync(config.storageKey));}
return results;
