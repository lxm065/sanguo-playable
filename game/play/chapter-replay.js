'use strict';
const c=require('./chapter-replay-config');
/** 最高已通关与进行中章节共同决定可选范围，重玩不会降低地图开放度。 */
function highest(p){return Math.max(c.firstChapter,p.state.cleared+1,p.state.chapter);}
/** 确认绑定当前局及节点，过期弹窗不能放弃后来开始的新进度。 */
function ticket(p){const s=p.state;return {chapter:s.chapter,section:s.section,layer:s.layer,activeNode:s.activeNode,run:p.model.state.expedition.tutorialRunId,serial:s.chapterReplaySerial||0};}
/** 原子重开目标章；清空局内阵容、装备与路线，永久章节、钻石和领取记录保留。 */
function start(p,chapter,token){return p.model.transact(()=>{const m=p.model,s=p.state;if(!Number.isInteger(chapter)||chapter<c.firstChapter||chapter>highest(p))throw Error('该章节尚未解锁');if(!token||JSON.stringify(token)!==JSON.stringify(ticket(p)))throw Error('远征进度已变化，请重新选择');m.editable();if(s.sectionReward||s.runReward)throw Error('请先领取当前结算奖励');s.chapter=chapter;s.section=c.firstSection;s.layer=c.firstLayer;s.lane=c.initialLane;s.activeNode=null;s.route=null;s.merchant=null;s.nodeEvent=null;s.routeEvents=null;s.routeLayout=null;s.hp=p.lord().hp;s.chapterReplaySerial=(s.chapterReplaySerial||0)+1;require('./equipment-tutorial').reset(s);const fresh=m.create();fresh.meta=s;fresh.seed=m.state.seed;fresh.gold=p.lord().coin;m.state=fresh;require('./route-variants').initialize(s);require('./route-events').initialize(m);m.roll();return true;});}
module.exports={highest,ticket,start};
