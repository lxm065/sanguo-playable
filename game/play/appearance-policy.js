"use strict";
/** 根据武将阶级选择外观，保持战斗身份与数值不变。 */
function resolve(config, id, star = 1) {
  const base = config.models[id] || config.legacy[id] || { assetKey: id };
  const variants = (config.variants?.[id] || []).filter(v => star >= v.minStar);
  return Object.assign({}, base, variants.sort((a,b) => b.minStar-a.minStar)[0]);
}
/** 枚举发布需要的基础外观和升阶外观。 */
function entries(config) {
  return Object.entries(config.models).flatMap(([id, base]) => [[id, base], ...(config.variants?.[id] || []).map(v => [id, Object.assign({},base,v)])]);
}
module.exports = { resolve, entries };
