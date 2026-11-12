'use strict';
const {fixture}=require('./profile-interaction-285.cjs'),{ExpeditionView}=require('../game/play/expedition-view');
/** 最小树保留层级、事件、组件和真实销毁行为，用于界面差异的自动回归。 */
class Node {
 constructor(name=''){this.name=name;this.children=[];this.components=new Map();this.events=new Map();this.isValid=true;this.active=true;this.position={x:0,y:0};}
 addChild(n){n.removeFromParent();n.parent=this;this.children.push(n);}
 removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}
 destroy(){this.emit('destroyed');this.removeFromParent();this.isValid=false;for(const n of [...this.children])n.destroy();}
 getSiblingIndex(){return this.parent?.children.indexOf(this)??0;}
 setSiblingIndex(i){const p=this.parent;if(p){this.removeFromParent();this.parent=p;p.children.splice(Math.min(i,p.children.length),0,this);}}
 getChildByName(name){return this.children.find(n=>n.name===name);}
 setPosition(x,y){this.position=typeof x==='object'?{...x}:{x,y};}
 setScale(){} setRotationFromEuler(){}
 addComponent(Type){const c=new Type();c.node=this;this.components.set(Type,c);return c;}
 getComponent(Type){return this.components.get(Type);}
 getComponentInChildren(Type){return this.getComponent(Type)||this.children.map(n=>n.getComponentInChildren(Type)).find(Boolean);}
 on(event,fn){this.events.set(event,[...(this.events.get(event)||[]),fn]);}
 once(event,fn){this.on(event,fn);}
 emit(event,data={}){for(const fn of this.events.get(event)||[])fn(data);}
}
/** 图形调用只统计清除次数；骨骼/GPU耗时须另外通过真实引擎验收。 */
class Graphics{clear(){this.clears=(this.clears||0)+1;}fill(){}stroke(){}rect(){}roundRect(){}circle(){}moveTo(){}lineTo(){}quadraticCurveTo(){}close(){}}
class Label{} class UITransform{setContentSize(){}convertToNodeSpaceAR(p){return p;}}
/** Tween 不启动后台循环，测试仍核对被重建的节点及动作监听器。 */
function tween(){const t={};for(const name of ['to','by','call','delay','set','repeatForever','start','stop'])t[name]=()=>t;return t;}
/** 隔离纯表现与预热端口，业务、布局、按钮及刷新模块保持真实实现。 */
function quiet(){const entries=[['battle-effects','warm'],['kill-banner','warm'],['battle-panel-warm','schedule'],['lord-skill-view','show'],['upgrade-effects','show'],['bond-trigger-view','show'],['hero-unlock-view','show'],['lord-level-notice','show'],['cloud-save-ui','indicator']];const originals=entries.map(([name,key])=>{const m=require('../game/play/'+name),old=m[key];m[key]=()=>{};return ()=>m[key]=old;});return ()=>originals.reverse().forEach(f=>f());}
/** 挂载真实战斗视图方法，所有存档只在内存并记录写入次数。 */
function scene(model=fixture(24)){
 const restore=quiet(),cc={Node,Graphics,Label,UITransform,Color:class{},LabelOutline:class{},UIOpacity:class{},BlockInputEvents:class{},Vec3:class{constructor(x,y,z=0){Object.assign(this,{x,y,z});}},Tween:{stopAllByTarget(){}},tween};
 Node.EventType={TOUCH_START:'start',TOUCH_MOVE:'move',TOUCH_END:'end',TOUCH_CANCEL:'cancel',NODE_DESTROYED:'destroyed'};cc.Input={EventType:Node.EventType};
 const counts={renders:0,actors:0,writes:0,enemies:0},root=new Node('root'),ui={};root.addComponent(UITransform);
 ui.node=(parent,name,x=0,y=0)=>{const n=new Node(name);parent.addChild(n);n.setPosition(x,y);return n;};ui.box=(...args)=>{const n=ui.node(...args);n.addComponent(Graphics);return n;};ui.image=ui.node;ui.portrait=ui.node;
 ui.text=(p,text,x,y)=>{const l=ui.node(p,'text',x,y).addComponent(Label);l.string=String(text);return l;};
 ui.button=(p,text,x,y,w,fn)=>{const n=ui.node(p,text,x,y);ui.text(n,text,0,0);n.on('end',fn);return n;};
 ui.actor=(p,unit,x,y,scale)=>{counts.actors++;const node=ui.node(p,'unit-'+unit.uid,x,y),body=ui.node(node,'body'),status=ui.node(node,'unit-status');return {node,body,status,unit,alive:true,sp:{},baseScale:scale};};
 const v=Object.create(ExpeditionView.prototype);Object.assign(v,{cc,root,ui,model,progress:model.progression,roster:model.roster,config:model.rules,assets:{},page:'battle',actors:new Map(),benchPage:0,speed:1,playing:false});
 const enemies=model.enemies.bind(model);model.enemies=()=>{counts.enemies++;return enemies();};model.storage.write=()=>counts.writes++;
 model.state.expedition.sunjian={uid:1,shown:true};model.state.expedition.heroObtained=model.roster.map(h=>h.id);
 v.render=function(){counts.renders++;for(const n of [...root.children])n.destroy();v.actors.clear();v.reserveScope=null;v.modal=null;v.battleRegions=null;v.formationAnchor=null;v.battlePreviewEnemies=null;if(v.page==='battle')v.renderBattle();require('../game/play/action-feedback').rendered(v);};
 v.render();return {v,model,counts,restore,close(){restore();root.destroy();}};
}
/** 战报使用真实初始阵容和结果格式，结算继续调用原领域逻辑及存档校验。 */
function reward(model,{kind='heroes',experience=0,training=false}={}){
 const initial=model.state.units.filter(u=>u.slot>=0).map(u=>({...u,side:'ally',x:u.slot%model.rules.columns,y:Math.floor(u.slot/model.rules.columns),hp:100,maxHp:100}));
 model.state.pending={id:model.state.battles+1,stage:model.state.stage,training,rewardKind:kind,choices:kind==='heroes'?['xuchu','guanyu','zhaoyun']:[],rewardStar:1,equipmentId:'7206',gold:50,experience,refreshes:0,battle:{initial,final:initial.map((u,i)=>({...u,hp:i===0?0:50,x:0,y:1})),events:[],result:'win',duration:1}};
}
module.exports={scene,fixture,reward,Node};
