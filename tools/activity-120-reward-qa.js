const req=GameGlobal[0].require,m=view.model,oldAd=view.ad;
m.transact(()=>m.activities.record('wins',10));req('play/activity-view.js').daily(view);
const before=m.state.meta.diamonds;view.ad=(done,after)=>{view.act(done);after();};
try{req('play/activity-view.js').claimDaily(view,'wins',m.activities.ticket());}finally{view.ad=oldAd;}
const labels=view.modal.getComponentsInChildren(cc.Label).map(x=>x.string),receipt=view.modal;
if(!labels.includes('获得物品')||m.state.meta.diamonds-before!==4000)throw Error('双倍回执错误');
sample.activity120.rewardLabels=labels;sample.activity120.dailyBehind=view.root.children.some(n=>n!==receipt&&n.getChildByName('activity-panel'));
return sample.activity120;
