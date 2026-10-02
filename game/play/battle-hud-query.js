"use strict";
const layout = require("./battle-hud-config"),
  rules = require("./expedition-config");
/** 推荐只筛选有空装备槽的己方实例，备战席也参与且不改变装备归属。 */
function recommendedUnits(item, units, equipment) {
  const ids = layout.recommendations[item.id] || [];
  return units
    .filter(
      (u) =>
        ids.includes(u.heroId) &&
        equipment.filter((e) => e.owner === u.uid).length <
          rules.equipmentLimit,
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
          point.y >= p.y + c.minY &&
          point.y <= p.y + c.maxY * p.scale,
      )
      .sort(
        (a, b) =>
          Math.hypot(point.x - a.x, point.y - a.y - (c.maxY * a.scale) / 2) -
          Math.hypot(point.x - b.x, point.y - b.y - (c.maxY * b.scale) / 2),
      )[0]?.uid ?? null
  );
}
/** 主公概率面板读取实际刷新策略，不展示未接入的高级概率。 */
function lordSummary(model) {
  const e = model.state.expedition;
  return {
    level: e.level,
    experience: e.experience,
    nextExperience: rules.experience.thresholds[e.level - 1] ?? null,
    limit: model.limit(),
    ranks: layout.rankRows.map((star) => ({
      star,
      percent:
        star <= rules.refreshRank
          ? star === rules.refreshRank
            ? 100
            : 0
          : null,
    })),
    guaranteedRank: rules.refreshRank,
  };
}
module.exports = { recommendedUnits, equipmentTarget, lordSummary };
