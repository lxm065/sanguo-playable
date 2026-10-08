'use strict';
const c=require('./battle-gold-config');
/** 在生成战果时冻结金币，失败、演武及第一章保留原规则。 */
function reward(state,node,pending){const chapter=state.meta?.chapter||1;if(pending.training||pending.battle.result!=='win'||chapter<c.fromChapter||c.base[node?.type]===undefined)return pending.gold;return c.base[node.type]+(chapter-c.fromChapter)*c.perChapter;}
module.exports={reward};
