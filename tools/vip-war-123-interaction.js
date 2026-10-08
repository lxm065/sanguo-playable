const req=GameGlobal[0].require,m=view.model;
/** 通过实际按钮事件验收领取、奖励分页和滚动拦截；仅使用隔离模型。 */
function find(root,name){if(root.name===name)return root;for(const n of root.children){const got=find(n,name);if(got)return got;}return null;}
function tap(root,name){const n=find(root,name);if(!n)throw Error('缺少按钮 '+name);n.emit(cc.Node.EventType.TOUCH_END,{});}
const report={};m.transact(()=>{m.state.meta.vip={points:20000,day:m.progression.day(),earned:0,serial:0,gifts:[],daily:''};req('play/war-order.js').record(m,20);});
req('play/vip-view.js').open(view,24);tap(view.modal,'领取礼包');report.giftClaimed=req('play/vip.js').state(m).gifts.includes(24);report.receipt=view.modal.getComponentsInChildren(cc.Label).some(l=>l.string==='获得物品');const stored=JSON.stringify(m.state);tap(view.modal,'下一页');report.pagingNoMutation=stored===JSON.stringify(m.state);tap(view.modal,'确定');report.returnToVip=view.modal.getComponentsInChildren(cc.Label).some(l=>l.string==='VIP礼包');
req('play/war-order-view.js').open(view);tap(view.modal,'领取奖励');report.freeClaimed=req('play/war-order.js').state(m).free.includes(0);tap(view.modal,'确定');report.returnToWar=view.modal.getComponentsInChildren(cc.Label).some(l=>l.string==='4星战令');
const list=find(view.modal,'war-order-scroll'),e=y=>({getUILocation:()=>({x:0,y}),propagationStopped:false});list.emit(cc.Node.EventType.TOUCH_START,e(0));list.emit(cc.Node.EventType.TOUCH_MOVE,e(90));report.scrollMoved=find(view.modal,'war-order-scroll-content').position.y>0;const before=JSON.stringify(m.state);tap(view.modal,'领取奖励');report.dragNoClaim=before===JSON.stringify(m.state);
if(Object.values(report).some(x=>x!==true))throw Error(JSON.stringify(report));return report;
