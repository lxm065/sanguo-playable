"use strict";
const handbook = require("./handbook-config"),
  policy = require("./expedition-config");
/** 按不同武将身份计算羁绊，同名多阶只占一个名额。 */
function bonds(units, roster) {
  const heroes = [...new Set(units.map((u) => u.heroId))].map((id) =>
    roster.find((h) => h.id === id),
  );
  return handbook.bonds.map((b) => {
    const count = heroes.filter((h) => h?.[b.kind] === b.value).length,
      index = handbook.thresholds.filter((n) => count >= n).length - 1;
    return {
      ...b,
      count,
      level: index + 1,
      amount: index < 0 ? 0 : b.values[index],
    };
  });
}
/** 生成装备、羁绊之后的面板属性，战斗与详情共用同一个计算入口。 */
function stats(
  unit,
  units,
  roster,
  equipment = [],
  rules = { hpGrowth: 1.8, attackGrowth: 1.5 },
) {
  const hero = roster.find((h) => h.id === unit.heroId),
    tier = hero.tiers?.find((t) => t.star === unit.star);
  const base = tier || {
    ...hero,
    hp: Math.round(hero.hp * Math.pow(rules.hpGrowth, unit.star - 1)),
    attack: Math.round(
      hero.attack * Math.pow(rules.attackGrowth, unit.star - 1),
    ),
  };
  const result = {
    ...hero,
    ...base,
    regen: 0,
    regenPercent: 0,
    block: 0,
    reduction: 0,
    leech: 0,
    reflect: 0,
    critical: 0,
    criticalBonus: 0,
    haste: 0,
    healPulse: 0,
    healInterval: 0,
    interval: hero.interval,
  };
  const team = units.map((u) => u.uid);
  for (const item of equipment) {
    const e = policy.equipment.find((v) => v.id === item.id);
    if (!e) continue;
    if (team.includes(item.owner)) {
      result.armor += e.teamArmor || 0;
      result.magicArmor = (result.magicArmor || 0) + (e.teamMagicArmor || 0);
      result.regen += e.teamRegen || 0;
      result.haste += e.teamHaste || 0;
      if (e.teamHeal) {
        result.healPulse += e.teamHeal;
        result.healInterval = e.healInterval;
      }
    }
    if (item.owner === unit.uid) {
      result.hp *= 1 + (e.hpPercent || 0);
      for (const k of [
        "regenPercent",
        "block",
        "reduction",
        "leech",
        "reflect",
      ])
        result[k] += e[k] || 0;
    }
  }
  for (const b of bonds(units, roster)) {
    if (!b.level) continue;
    const applies = hero[b.kind] === b.value;
    if (b.id === "shu") result.regenPercent += b.amount / 100;
    if (applies && b.id === "wei") result.armor += b.amount;
    if (applies && b.id === "wu") result.haste += b.amount / 100;
    if (applies && b.id === "warrior") result.hp *= 1 + b.amount / 100;
    if (applies && b.id === "archer") result.attack *= 1 + b.amount / 100;
    if (applies && b.id === "vanguard") {
      result.critical += b.amount / 100;
      result.criticalBonus = b.values[2] / 100;
    }
  }
  result.hp = Math.round(result.hp);
  result.attack = Math.round(result.attack);
  result.interval /= 1 + result.haste;
  return result;
}
module.exports = { bonds, stats };
