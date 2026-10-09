"use strict";
const layout = require("./battle-hud-config"),
  rules = require("./expedition-config");
/** 推荐按英雄适配筛选全部己方实例，满槽仍保留提示，备战席也参与且不改变装备归属。 */
function recommendedUnits(item, units, equipment) {
  const ids = require('./equipment-recommendations').heroIds(item.id);
  return units
    .filter(
      (u) =>
        ids.includes(u.heroId),
    )
    .map((u) => u.uid);
}
/** 根据实际显示位置命中己方棋子，空白和敌方不会得到穿戴目标。 */
function equipmentTarget(point, positions) {
  const c = layout.targeting;
  return (
    positions
      .filter(
        (p) =>
          Math.abs(point.x - p.x) <= c.halfWidth &&
          point.y >= p.y + c.minY * p.scale &&
          point.y <= p.y + c.maxY * p.scale,
      )
      .sort(
        (a, b) =>
          Math.hypot(point.x - a.x, point.y - a.y) -
          Math.hypot(point.x - b.x, point.y - b.y),
      )[0]?.uid ?? null
  );
}
/** 主公概率面板读取实际刷新策略，不展示未接入的高级概率。 */
function lordSummary(model) {
  const e = model.state.expedition;
  return {
    level: e.level,
    experience: e.experience,
    nextExperience: require('./level-progression').cost(e.level),
    limit: model.limit(),
    ranks: layout.rankRows.map((star) => ({
      star,
      percent: e.level<(require('./reward-rank-config').unlockLevels[star]||1)?null:require('./reward-rank').weights(e.level)[star-1],
      unlockLevel:require('./reward-rank-config').unlockLevels[star],
    })),
    guaranteedRank: rules.refreshRank,
  };
}
module.exports = { recommendedUnits, equipmentTarget, lordSummary };
