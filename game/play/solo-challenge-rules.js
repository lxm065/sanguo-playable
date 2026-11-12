'use strict';
const config=require('./solo-challenge-config'),data=require('./solo-challenge-data');
/** 不同星级沿用原角色身份，禁用条件覆盖同一角色的所有变体。 */
function identity(id){return Number(id)%100;}
/** 由原ID映射三国身份，不用未登记武将替换缺失资料。 */
function hero(id){return require('./handbook-config').heroes.find(h=>identity(h.sourceId)===identity(id));}
/** 原表保留完整章节、禁用、主公、九节标题和节点模板引用。 */
function dungeon(id){const row=data.dungeons.find(r=>r.id===id);if(!row)throw Error('未知英雄副本');return row;}
/** 副本禁用过滤同时用于开局、招募、合成和奖励。 */
function available(model,row){return model.availableRoster().filter(h=>!h.legacy&&!(row?.banned||[]).some(id=>hero(id)?.id===h.id));}
/** 原版只确认节点模板ID，具体路线使用独立可配置本地适配器。 */
function route(row,section,rng){const c=config.economy,base=[...require('./route-config').routes[(Number(row.templates[section-1])/1000-1)%require('./route-config').routes.length]];
 if(row.buff===5)for(let i=1;i<base.length;i++)if(base[i]==='spring')base[i-1]='merchant';
 if(row.buff===6||row.buff===11)for(let i=1;i<base.length;i++)if(base[i]==='battle'&&rng()<(row.buff===6?c.treasureChance:c.springChance))base[i]=row.buff===6?'treasure':'spring';
 return [...base,'boss'];}
/** 竞技段位名称与阈值直接来自原版段位表，星数增减由本地策略控制。 */
function rank(stars){return data.ranks.find(r=>stars<=r.stars)||data.ranks.at(-1);}
module.exports={identity,hero,dungeon,available,route,rank};
