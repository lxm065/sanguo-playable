'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {ClassicView}=require('../game/play/classic-view');
const {Expedition}=require('../game/play/expedition');
const {RewardedAds}=require('../game/play/ads');
const roster=require('../game/play/expedition-roster');
const rules=require('../game/play/config');
const bonds=require('../game/play/bond-activation');
const vip=require('../game/play/vip');

/** 用真实图鉴、广告和结算事务验证恢复，场景替身模拟 Cocos 在帧尾才销毁节点。 */
function fixture(page){
 const model=new Expedition(rules,roster,{read:()=>null,write(){}});
 require('../game/play/classic-hooks').attach(model,roster);
 model.transact(()=>{model.state.meta.cleared=1;});
 const ad={onClose(callback){this.close=callback;},onError(){},offClose(){},offError(){},show(){return Promise.resolve();}};
 /** 模拟从画布移除后，节点的 isValid 在当帧依然为真。 */
 function node(parent,name,x=0,y=0){
  const value={name,parent,children:[],isValid:true,position:{x,y},
   addComponent(){return {circle(){},fill(){},stroke(){}};},on(){},
   removeFromParent(){this.parent.children=this.parent.children.filter(child=>child!==this);this.parent=null;},
   destroy(){this.destroyScheduled=true;},
  };
  parent?.children.push(value);
  return value;
 }
 const view=Object.assign(Object.create(ClassicView.prototype),{
  model,progress:model.progression,roster,page,root:node(null,'canvas'),mapOffset:-220,
  ads:new RewardedAds({createRewardedVideoAd:()=>ad},require('../game/play/classic-config').ads),
  cc:{Node:{EventType:{}},Color:class{},BlockInputEvents:class{},Mask:class{}},
  paper:node,
  ui:{node,box:node,image:node,portrait:node,text(parent,label){return {node:node(parent,label)};},
   button(parent,label,x,y,width,click){const button=node(parent,label,x,y);button.click=click;return button;},
  },
  render(){for(const child of [...this.root.children]){child.removeFromParent();child.destroy();}this.modal=null;},
 });
 return {view,ad,model};
}

test('赵云两项羁绊的视频结算后恢复原羁绊页和滚动位置',async()=>{
 for(const [page,id] of [['home','dragon'],['map','vanguard']]){
  const {view,ad,model}=fixture(page);
  view.openHandbook();
  const book=view.handbook;book.tab='bonds';book.offsets.bonds=135;book.render();
  const previous=book.modal,scroll=book.panel.children.find(n=>n.name==='handbook-scroll');
  const card=scroll.children[0].children.find(n=>n.name==='activate-bond-'+id);
  const button=card.children.find(n=>typeof n.click==='function');
  const points=vip.state(model).points;
  const completion=button.click();ad.close({isEnded:true});await completion;
  assert.equal(previous.isValid,true);assert.equal(previous.parent,null);assert(previous.destroyScheduled);
  assert.equal(view.page,page);assert.equal(view.mapOffset,-220);
  assert.equal(view.handbook.tab,'bonds');assert.equal(view.handbook.offsets.bonds,135);
  assert(view.modal===view.handbook.modal&&view.modal?.parent===view.root,'羁绊弹窗应挂在当前画布上');
  assert(bonds.state(model).includes(id));assert.equal(vip.state(model).points,points+1);
  const content=view.handbook.panel.children.find(n=>n.name==='handbook-scroll').children[0];
  assert(content.children.some(n=>n.name==='bond-'+id));assert(!content.children.some(n=>n.name==='activate-bond-'+id));
 }
});
