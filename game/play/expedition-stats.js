"use strict";
const handbook = require("./handbook-config"),
  policy = require("./expedition-config");
/** 按不同武将身份计算羁绊，同名多阶只占一个名额。 */
function bonds(units, roster, active) {
  const heroes = [...new Set(units.map((u) => u.heroId))].map((id) =>
    roster.find((h) => h.id === id),
  );
  return handbook.bonds.map((b) => {
    const count = heroes.filter((h) => require('./bond-activation').member(b,h)).length,
      index = require("./bond-activation").enabled(b.id,active)?(b.thresholds||handbook.thresholds).filter((n) => count >= n).length - 1:-1;
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
    magicPen:0,
    equipmentHits:[],
    healPulse: 0,
    healInterval: 0,
    interval: hero.interval,
  };
  const team = units.map((u) => u.uid);
  for (const item of equipment) {
    const definition = policy.equipment.find((v) => v.id === item.id);
    const resolved = definition && require("./equipment-upgrades").resolve(definition,rules.playerEquipmentGrades);
    const e=resolved&&require("./enemy-budget").equipment(resolved,item);
    if (!e) continue;
    if (team.includes(item.owner)) {
      result.armor += e.teamArmor || 0;
      result.magicArmor = (result.magicArmor || 0) + (e.teamMagicArmor || 0);
      result.regen += e.teamRegen || 0;
      result.haste += e.teamHaste || 0;
      result.magicPen=Math.min(policy.teamMagicPenCap,result.magicPen+(e.teamMagicPen||0));
      if (e.teamHeal) {
        result.healPulse += e.teamHeal;
        result.healInterval = e.healInterval;
      }
    }
    if (item.owner === unit.uid) {
      if(e.onHit&&!result.equipmentHits.some(x=>x.id===e.id))result.equipmentHits.push({id:e.id,...e.onHit});
      const basic=e.basic;
      for(const key of ["hp","armor","magicArmor","regen","haste","critical","criticalBonus"])result[key]=(result[key]||0)+(basic[key]||0);
      result.attack+=basic[hero.magic?"magicAttack":"physicalAttack"]||0;
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
  for (const b of bonds(units, roster,rules.playerBonds)) {
    if (!b.level) continue;
    const applies = require("./bond-activation").member(b,hero);
    if(applies&&b.id==="dragon")result.bondDodge=b.amount/100;
    if (b.id === "shu") result.regenPercent += b.amount / 100;
    if (applies && b.id === "wei") result.armor += b.amount;
    if (applies && b.id === "wu") result.haste += b.amount / 100;
    if (applies && b.id === "warrior") result.hp *= 1 + b.amount / 100;
    if (applies && b.id === "archer") result.attack *= 1 + b.amount / 100;
    if (applies && b.id === "vanguard") {
      result.critical += b.amount / 100;
      result.criticalBonus += b.values[2] / 100;
    }
  }
  result.hp+=rules.playerVip?.data_8||0;result.attack+=rules.playerVip?.data_7||0;
  require("./talent-effects").stats(result,unit,units,roster,rules.playerTalentTree);
  result.hp = Math.round(result.hp);
  result.attack = Math.round(result.attack);
  result.interval /= 1 + result.haste;
  return result;
}
module.exports = { bonds, stats };
