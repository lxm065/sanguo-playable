'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {bindScroll}=require('../game/play/scroll-gesture');
const {BattleHud}=require('../game/play/battle-hud');
const config=require('../game/play/battle-hud-config');
/** 模拟最小节点生命周期和触摸事件，不读取或写入玩家存档。 */
function node(parent,name){const n={name,parent,children:[],events:{},position:{y:0},isValid:true,addComponent(Type){return new Type();},on(type,fn){this.events[type]=fn;},setSiblingIndex(){},setPosition(x,y){this.position={x,y};},getChildByName(name){return this.children.find(c=>c.name===name);},removeFromParent(){this.parent.children=this.parent.children.filter(c=>c!==this);},destroy(){this.destroyed=true;}};parent?.children.push(n);return n;}
/** 根据逻辑屏幕坐标生成手势事件。 */
function event(x,y){return {getUILocation:()=>({x,y})};}
test('轻微抖动不滚动；拖动后即使停留也不能误触，下次按下复位',()=>{
 const cc={Node:{EventType:{TOUCH_START:'start',TOUCH_MOVE:'move',TOUCH_END:'end',TOUCH_CANCEL:'cancel'}}},viewport=node(null,'scroll'),content=node(viewport,'content');let dragged=false,offset=0;
 bindScroll(cc,viewport,content,{min:-100,max:0,threshold:14,onDrag:v=>dragged=v,onOffset:v=>offset=v});
 viewport.events.start(event(0,0));viewport.events.move(event(3,-4));assert.equal(dragged,false);assert.equal(offset,0);
 viewport.events.move(event(0,-40));assert.equal(dragged,true);assert.equal(offset,-40);viewport.events.end();assert.equal(dragged,true);
 viewport.events.start(event(0,0));assert.equal(dragged,false);viewport.events.move(event(0,-200));assert.equal(offset,-100);viewport.events.cancel();assert.equal(dragged,true);
});
test('装备连续翻页只替换装备容器，武将节点、动画与模型不变',()=>{
 const root=node(null,'root'),actor=node(root,'hero'),capacity=config.equipment.columns*config.equipment.rows;
 const model={state:{expedition:{equipment:Array.from({length:capacity+1},(_,i)=>({uid:i,id:'7202',owner:null}))}}},before=JSON.stringify(model);
 const ui={node,box:node,text(){},image(){},button(parent,name,x,y,w,action){const n=node(parent,name);n.click=action;return n;}};
 const view={cc:{Node:{EventType:{TOUCH_END:'end'}},Color:class{},Graphics:class{circle(){}fill(){}stroke(){}}},root,ui,model,actors:new Map([[1,actor]]),render(){throw Error('翻页不应重绘全屏');}};
 const hud=new BattleHud(view);hud.bindEquipment=()=>{};hud.renderEquipment();
 const first=root.getChildByName('equipment-inventory');assert(!first.getChildByName('›'));require('../game/play/equipment-swipe').turn(view,{x:100,y:0},{x:0,y:0});
 const second=root.getChildByName('equipment-inventory');assert.equal(first.destroyed,true);assert.equal(view.equipmentPage,1);assert(second.getChildByName('equipment-drag-'+capacity));
 require('../game/play/equipment-swipe').turn(view,{x:0,y:0},{x:100,y:0});assert.equal(view.equipmentPage,0);assert.equal(root.children.length,2);assert.equal(view.actors.get(1),actor);assert(!actor.destroyed);assert.equal(JSON.stringify(model),before);
});
