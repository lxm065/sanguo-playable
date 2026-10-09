'use strict';
const c=require('./elite-loot-config');
/** 精英胜利结算时抽取一次品质与物品，回执保存后不重新抽取。 */
function pick(chapter,rng){const pool=chapter>=c.fromChapter&&rng()<c.purpleChance?c.purple:c.blue;return pool[Math.floor(rng()*pool.length)];}
module.exports={pick};
