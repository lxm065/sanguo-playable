'use strict';
const config=require('./equipment-recommendation-config');
/** 按真实攻击类型、职业及射程解析单件装备，不再使用固定英雄兜底名单。 */
function heroIds(id,roster=require('./expedition-roster')) {
 const exclusive=require('./equipment-exclusive-config').items[id];if(exclusive)return exclusive.filter(id=>roster.some(h=>h.id===id));
 const entry=config.items[id],rule=entry&&config.profiles[entry.profile];
 if(!rule)return [];
 return roster.filter(h=>!h.legacy&&(!rule.roles||rule.roles.includes(h.role))&&(rule.magic===undefined||require('./hero-damage').accepts(h,rule.magic))&&(rule.maxRange===undefined||h.range<=rule.maxRange)).map(h=>h.id);
}
module.exports={heroIds};
