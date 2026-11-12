/** 在现有引擎中创建独立屏外节点，只验证骨骼复用，不读取或改写玩家存档。 */
(async function verifyEngineReuse(){
 const g=GameGlobal[0],req=g.__wxRequire,cc=await g.System.import('cc'),{Assets}=req('./assets'),{Widgets}=req('./widgets'),config=req('./config'),bodies=req('./preparation-bodies');
 const root=new cc.Node('isolated-performance-285');root.layer=cc.Layers.Enum.UI_2D;root.addComponent(cc.UITransform);root.setPosition(10000,0,0);cc.director.getScene().getChildByName('Canvas').addChild(root);
 const assets=new Assets(cc,g.wx,config),ui=new Widgets(cc,assets,config.colors),v={cc,root,ui,actors:new Map(),model:{state:{pending:null}},page:'battle',preparationRendered:true};
 const units=Array.from({length:8},(_,i)=>({uid:i+1,heroId:'xuchu',star:3,slot:i}));
 /** 等待模型装配完成或超时，避免把尚未解析的骨骼误计为复用。 */
 async function ready(){for(let i=0;i<100;i++){if([...v.actors.values()].every(a=>a.sp.skeletonData))return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('模型装配超时');}
 try{
  for(const u of units)v.actors.set(u.uid,ui.actor(root,u,0,0,1));await ready();
  const old=new Map(v.actors),pool=bodies.begin(v);for(const n of [...root.children]){n.removeFromParent();n.destroy();}v.actors.clear();
  for(const u of units)v.actors.set(u.uid,ui.actor(root,u,0,0,1));bodies.end(v,pool);
  const reused=[...v.actors].filter(([id,a])=>a.body===old.get(id).body).length,freshTouchNodes=[...v.actors].every(([id,a])=>a.node!==old.get(id).node);
  const pool2=bodies.begin(v);for(const n of [...root.children]){n.removeFromParent();n.destroy();}v.actors.clear();units[0].star=4;
  for(const u of units)v.actors.set(u.uid,ui.actor(root,u,0,0,1));bodies.end(v,pool2);await ready();
  const report={version:req('./app-version').version,reused,total:units.length,freshTouchNodes,upgradedBodyReplaced:v.actors.get(1).body!==old.get(1).body,othersPreserved:[...v.actors].filter(([id,a])=>id!==1&&a.body===old.get(id).body).length};
  if(reused!==8||!freshTouchNodes||!report.upgradedBodyReplaced||report.othersPreserved!==7)throw Error(JSON.stringify(report));g.__performance285QA=report;console.log('PERFORMANCE285 '+JSON.stringify(report));
 }catch(e){console.error('PERFORMANCE285_FAILED '+String(e.stack||e));}finally{root.removeFromParent();root.destroy();}
})();
