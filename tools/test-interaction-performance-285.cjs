'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),config=require('../game/play/interaction-performance-config');
const reference=require('../game/play/strongest-team'),{fixture}=require('./profile-interaction-285.cjs');
/** 复制样本避免强阵容外层缓存遮蔽本次要验证的搜索。 */
function search(m){return reference.query(JSON.parse(JSON.stringify(m.state)),m.rules);}
test('评分复用保持最终阵容、装备实例和全部浮点数一致，成长和装备变化不串缓存',()=>{
 const previous=config.scoreCacheEntries;
 try{for(const count of [8,24,60]){const m=fixture(count);for(let i=0;i<3;i++){m.state.expedition.equipment[0].stacks=i;m.state.expedition.equipment[1].potency=1+i*.1;m.state.meta.equipmentGrades={'7206':i};config.scoreCacheEntries=0;const before=search(m);config.scoreCacheEntries=previous;assert.deepEqual(search(m),before);}}}finally{config.scoreCacheEntries=previous;}
});
test('缓存只保存有限数量数值，并区分装备顺序、归属和成长',()=>{
 const before=config.scoreCacheEntries;config.scoreCacheEntries=2;
 try{let calls=0;const evaluate=require('../game/play/static-score-cache').create(()=>++calls),team=[{uid:1,heroId:'xuchu',star:3},{uid:2,heroId:'guanyu',star:3}],items=[{uid:1,owner:1,id:'7206',stacks:0}];assert.equal(evaluate(team,null,null,items),1);assert.equal(evaluate(team,null,null,[{...items[0],uid:20}]),1);assert.equal(evaluate(team,null,null,[{...items[0],owner:2}]),2);assert.equal(evaluate(team,null,null,[{...items[0],stacks:1}]),3);assert.equal(evaluate(team,null,null,[{...items[0],stacks:1}]),4);assert.equal(evaluate(team,null,null,items),1);}finally{config.scoreCacheEntries=before;}
});
/** 最小节点树模拟真实的移除、挂接和递归销毁，检查脱离旧根后的身体存活。 */
function node(){return {isValid:true,parent:null,children:[],removeFromParent(){if(this.parent)this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;},addChild(n){n.removeFromParent();n.parent=this;this.children.push(n);},destroy(){this.removeFromParent();this.isValid=false;for(const n of [...this.children])n.destroy();}};}
/** 隔离备战模型，装配中的节点和已装配节点分开覆盖。 */
function view(){const root=node(),actors=new Map();for(let uid=1;uid<=3;uid++){const parent=node(),body=node();root.addChild(parent);parent.addChild(body);actors.set(uid,{node:parent,body,bodyKey:'["xuchu",3]',sp:{skeletonData:uid<3?{}:null}});}return {root,actors,ui:{},page:'battle',preparationRendered:true,model:{state:{pending:null}}};}
test('仅复用同身份同阶已装配身体，旧触摸节点销毁，升级与未显示模型及时回收',()=>{
 const bodies=require('../game/play/preparation-bodies'),v=view(),old=v.actors.get(1),pool=bodies.begin(v);for(const n of [...v.root.children])n.destroy();assert.equal(old.node.isValid,false);assert.equal(old.body.isValid,true);assert.equal(v.actors.get(3).body.isValid,false);
 const fresh=node(),entry=bodies.take(v.ui,{uid:1,heroId:'xuchu',star:3},fresh);assert.equal(entry.body,old.body);assert.equal(old.body.parent,fresh);assert.equal(bodies.take(v.ui,{uid:2,heroId:'xuchu',star:4},node()),null);bodies.end(v,pool);assert.equal(old.body.isValid,true);assert.equal(v.actors.get(2).body.isValid,false);assert.equal(v.ui.preparationBodies,null);
});
test('战斗、待领取、换页和首次进入不复用旧骨骼，未消费缓存可在异常出口释放',()=>{
 const bodies=require('../game/play/preparation-bodies');for(const patch of [{playing:true},{startingBattle:true},{page:'map'},{preparationRendered:false},{model:{state:{pending:{}}}}]){const v=Object.assign(view(),patch);assert.equal(bodies.begin(v),null);assert.equal(v.actors.get(1).body.parent,v.actors.get(1).node);}
 const v=view(),pool=bodies.begin(v);bodies.end(v,pool);assert.equal(v.actors.get(1).body.isValid,false);
});
test('备战低帧率和开战恢复读取配置，重复渲染不重复提交引擎设置',()=>{
 const cadence=require('../game/play/render-cadence');let rate=60,writes=0;const v={cc:{game:{get frameRate(){return rate;},set frameRate(value){rate=value;writes++;}}}};cadence.apply(v);assert.equal(rate,config.idleFrameRate);cadence.apply(v);assert.equal(writes,1);v.startingBattle=true;cadence.apply(v);assert.equal(rate,config.battleFrameRate);v.startingBattle=false;v.playing=true;cadence.apply(v);assert.equal(writes,2);v.playing=false;cadence.apply(v);assert.equal(rate,config.idleFrameRate);
});
test('被动读取随技能列表实时变化，未知技能和空技能安全跳过',()=>{
 const skill=require('../game/play/hero-skills'),defs=require('../game/play/hero-skill-config'),pair=Object.entries(defs).find(([,v])=>v?.kind==='aura'),unit={skills:[{id:'missing'},{id:pair[0]}]};assert.equal(skill.passive(unit,'aura'),pair[1]);unit.skills=[];assert.equal(skill.passive(unit,'aura'),undefined);
});
