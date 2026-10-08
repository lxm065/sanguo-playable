'use strict';
const {call}=require('./devtool.cjs');
/** 在独立内存档中验证页面，保留并校验实际玩家完整状态。 */
const actions={
 freeze:"const v=view.challengeView;if(v.service.model!==sample.challengeQA)throw Error('只允许冻结独立验收档');v.service.clock=()=>1000;v.service.model.transact(()=>{v.service.state.run.deadline=31000;});return {isolatedClock:true};",
 inspect:"const v=view.challengeView;return {screen:v.screen,selected:v.selected,message:v.message,phase:v.service.state?.run?.phase,player:v.service.state?.run?.players[0],playerUnchanged:sample.challengeOriginal===JSON.stringify(model.state)};",
 setup:"if(view.challengeView)view.challengeView.close();sample.challengeOriginal=JSON.stringify(model.state);const req=GameGlobal[0].require;const m=new (req('play/expedition.js').Expedition)(config,roster,{read:()=>null,write:()=>{}});req('play/classic-hooks.js').attach(m,roster);m.state.meta.chapter=2;m.state.meta.cleared=1;req('play/classic-hooks.js').attach(m,roster);req('play/challenge-view.js').menu(view);view.challengeView.service=new (req('play/challenge.js').Challenge)(m);sample.challengeQA=m;return {isolated:true,playerUnchanged:sample.challengeOriginal===JSON.stringify(model.state)};",
 lobby:"view.challengeView.open('multiplayer');return {screen:view.challengeView.screen,labels:view.challengeView.root.getComponentsInChildren(cc.Label).map(l=>l.string)};",
 decks:"const v=view.challengeView;v.deckIndex=0;v.draft=[...v.service.state.decks[0]];v.screen='decks';v.render();return {labels:v.root.getComponentsInChildren(cc.Label).map(l=>l.string)};",
 game:"const v=view.challengeView;v.service.start();v.screen='game';v.render();return {phase:v.service.state.run.phase,labels:v.root.getComponentsInChildren(cc.Label).map(l=>l.string)};",
 prepare:"const v=view.challengeView;v.service.choose(0);v.service.deploy(v.service.state.run.players[0].units[0].uid,2);v.service.upgrade();v.service.refresh();const p=v.service.state.run.players[0],i=p.choices.findIndex(id=>id!==p.units[0].heroId);if(i<0)throw Error('需刷新不同候选');v.service.choose(i);v.render();return {player:v.service.state.run.players[0]};",
 battle:"const v=view.challengeView;v.service.resolve();v.render();v.play();return {playing:v.playing,result:v.replay.result,events:v.replay.events.length};",
 result:"const v=view.challengeView;v.finish();return {phase:v.service.state.run.phase,labels:v.root.getComponentsInChildren(cc.Label).map(l=>l.string)};",
 final:"const v=view.challengeView;v.service.claim();while(v.service.state.run.phase!=='finished'){v.service.resolve();v.service.claim();}v.render();return {place:v.service.state.run.place,matches:v.service.state.matches,playerUnchanged:sample.challengeOriginal===JSON.stringify(model.state)};",
 restore:"if(sample.challengeOriginal!==JSON.stringify(model.state))throw Error('真实玩家状态变化');view.challengeView?.close();return {restored:true,playerUnchanged:true};",
};
/** 仅运行枚举的测试步骤，工具参数不参与动态代码拼接。 */
function main(){const action=actions[process.argv[2]];if(!action)throw Error('未知验收步骤');const result=call('automation_evaluate',{'fn-source':'function(){const sample=GameGlobal[0].__sanguoPlay;const {model,view,config,roster,cc}=sample;'+(process.argv[2]==='setup'?'':"if(!sample.challengeQA||!view.challengeView||view.challengeView.service.model!==sample.challengeQA)throw Error('独立验收档已失效');")+action+'}'});console.log(JSON.stringify(result,null,2));}
main();
