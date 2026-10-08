'use strict';
const config=require('./classic-config');
const {Progression}=require('./progression');
/** 给纯战役模型注入章节策略，UI 不参与解锁和奖励判定。 */
function attach(model,roster){const progress=new Progression(model,config);model.progression=progress;require("./speed-credits").initialize(model);require('./novice-rewards').initialize(model);model.activities=new (require('./activities').Activities)(model);model.hooks={
 /** 张飞解锁前不会从随机合成、选将或商店获得。 */
 pool(){return roster.filter(h=>progress.state.unlocked.includes(h.id));},
 /** 刘备的仁德额外增加1名上阵单位，基础人数与等级成长分开。 */
 limit(){return Math.min(model.rules.maxDeployedLimit,config.baseArmyLimit+(config.lordArmyBonus[progress.state.lord]||0)+Math.floor(model.state.wins/model.rules.limitEveryWins));},
 /** BOSS 使用独立章节阵容，其余节点继续使用本地战斗生成。 */
 enemies(){const node=progress.nodes().find(n=>n.id===progress.state.activeNode);return node?.type==='boss'?require('./boss-encounter').enemies(progress.section(),roster):null;},
 /** 未进入地图战斗节点或生命耗尽时不能跨关启动战斗。 */
 beforeFight(training){if(training)return;if(progress.state.hp<=0)throw Error('本次远征生命耗尽');const node=progress.nodes().find(n=>n.id===progress.state.activeNode);if(!node||!['battle','elite','boss'].includes(node.type))throw Error('请先在章节地图选择战斗节点');require('./enemy-budget').lock(model);return require('./lord-preparation').beforeFight(model,training);},
 /** 与领奖共享同一事务，退出重启或重复点击不会重复解锁。 */
 settle(pending){require('./chapter-difficulty').settle(model.state,pending);progress.settle(pending);}
};if(model.state.shop.some(id=>id&&!progress.state.unlocked.includes(id)))model.transact(()=>{model.state.shop=model.availableRoster().slice(0,model.rules.shopSize).map(h=>h.id);});require('./sign-rewards').settleReserved(progress);require('./activity-rewards').settleLegacy(model);return progress;}
module.exports={attach};
