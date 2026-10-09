'use strict';
const c=require('./equipment-ad-config');
/** 紫色进阶独立要求完整广告，所有入口共用该策略。 */
function required(item){return c.upgradeQualities.includes(item.quality);}
/** 永久章节、已获得装备、材料缺口与结算锁共同决定视频碎片资格。 */
function eligible(model,id){const q=require('./equipment-catalog').query(id,model.state);return c.fragmentsEnabled&&c.fragmentQualities.includes(q.quality)&&q.active&&!q.needsUnlock&&q.revealed&&!q.max&&!model.state.pending&&(model.state.meta.cleared||0)>=q.requiredChapter&&q.fragments<q.cost.fragments;}
/** 完成回调再次校验缺口与等级，消费一次性凭据后才入库。 */
function claim(model,id,grade,ticket){return model.transact(()=>{model.editable();const q=require('./equipment-catalog').query(id,model.state);if(q.grade!==grade||!eligible(model,id))throw Error('领取条件已变化，请重新查看');model.consumeAd(ticket);const bag=model.state.meta.inventory;bag[id]=(bag[id]||0)+c.fragmentReward;return c.fragmentReward;});}
module.exports={required,eligible,claim};
