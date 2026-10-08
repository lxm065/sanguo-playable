const req=GameGlobal[0].require,m=view.model,old=view.ad;
m.transact(()=>m.activities.record('wins',10));const before={...m.state.meta.inventory};
view.ad=(done,after)=>{view.act(done);after();};
try{req('play/activity-view.js').claimDaily(view,'wins',m.activities.ticket());const entries=Object.entries(m.state.meta.inventory).filter(([id])=>req('play/equipment-theme.js')[id]).map(([id,n])=>[id,n-(before[id]||0)]).filter(([,n])=>n>0);if(entries.reduce((n,[id,q])=>n+q,0)!==10)throw Error('碎片数量错误');if(view.modal.getChildByName('activity-reward-101'))throw Error('回执仍有问号碎片');return {fragments:entries,labels:view.modal.getComponentsInChildren(cc.Label).map(l=>l.string),dailyBehind:view.root.children.some(n=>n!==view.modal&&n.getChildByName('activity-panel'))};}finally{view.ad=old;}
