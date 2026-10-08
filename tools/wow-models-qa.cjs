'use strict';
const fs=require('node:fs'),path=require('node:path'),{call}=require('./devtool.cjs'),config=require('./wow-models.config.json');
/** 分离异步加载与同步查询，避免自动化桥在长 Promise 内阻塞引擎消息循环。 */
function main(){
 const mode=process.argv[2]||'inspect',ids=JSON.stringify(Object.keys(config.heroes));
 const operations={
  start:`if(sample.wowQA?.status==='loading')return {status:'loading'};sample.wowQA={before:JSON.stringify(model.state),status:'loading',results:[]};const q=sample.wowQA;(async()=>{for(const id of ${ids}){const data=await sample.assets.skeleton(id);const runtime=data.getRuntimeData();if(!runtime)throw Error('引擎解析失败 '+id);q.results.push({id,loaded:true,actions:runtime.animations.map(a=>a.name),textures:data.textureNames.length,nativeWow:data.battleManifest.nativeWow});}q.status='ready';})().catch(e=>{q.status='failed';q.error=String(e.stack||e);});return {started:true};`,
  inspect:`const q=sample.wowQA;return q?{status:q.status,error:q.error,results:q.results,playerStateUnchanged:JSON.stringify(model.state)===q.before}:null;`,
  actions:`const q=sample.wowQA;if(!q?.node?.isValid)throw Error('先创建展示层');const result=[];for(const sp of q.node.getComponentsInChildren(cc.sp.Skeleton)){let count=0;for(const a of Object.keys(sp.skeletonData.skeletonJson.animations)){if(!sp.setAnimation(0,a,false))throw Error('动作播放失败 '+a);count++;}sp.setAnimation(0,'idle-se',true);result.push({model:sp.skeletonData.name,played:count});}cc.game.step();return {result,playerStateUnchanged:JSON.stringify(model.state)===q.before};`,
  show:`const q=sample.wowQA;if(q?.status!=='ready')throw Error('尚未载入');if(q.node?.isValid)q.node.destroy();const node=view.ui.box(view.root,'wow-models-qa',0,0,714,1220,'#242C32');q.node=node;view.ui.text(node,'魔兽资源 · 四将模型',0,545,34,'#F1DEAC',680);for(const [i,id] of ${ids}.entries()){const h=roster.find(h=>h.id===id),x=i%2?175:-175,y=i<2?195:-285;const actor=view.ui.actor(node,{uid:9800+i,heroId:id,star:h.tier,side:'ally'},x,y,1.65,false);actor.facing='se';actor.updateLayout();view.ui.animate(actor,'idle',true);view.ui.text(node,h.name,x,y+218,32,'#F1DEAC',300);view.ui.text(node,'原生骨骼 · 五套动作',x,y-90,22,'#DBE1D8',320);}return {shown:true};`,
  restore:`const q=sample.wowQA;if(q?.node?.isValid)q.node.destroy();const unchanged=!q||JSON.stringify(model.state)===q.before;delete sample.wowQA;if(!unchanged)throw Error('玩家状态发生改变，请核对');return {restored:true,playerStateUnchanged:unchanged};`
 };
 if(!operations[mode])throw Error('未知验证步骤');
 const result=call('automation_evaluate',{'fn-source':'function(){const sample=GameGlobal[0].__sanguoPlay;if(!sample)throw Error("游戏尚未就绪");const {cc,model,view,roster}=sample;'+operations[mode]+'}'});
 const out=path.resolve(__dirname,'../evidence/wow-models');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'runtime-'+mode+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}
main();
