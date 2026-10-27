'use strict';
const config=require('./equipment-recommendation-config');
/** 普通推荐仅按配置的攻击成长、职业及射程匹配；专属资格由独立模块判定，不参与过滤。 */
function heroIds(id,roster=require('./expedition-roster')) {
 const entry=config.items[id],rule=entry&&config.profiles[entry.profile];
 if(!rule)return [];
 return roster.filter(h=>!h.legacy&&(!rule.roles||rule.roles.includes(h.role))&&(rule.magic===undefined||require('./hero-damage').accepts(h,rule.magic))&&(rule.maxRange===undefined||h.range<=rule.maxRange)).map(h=>h.id);
}
module.exports={heroIds};
