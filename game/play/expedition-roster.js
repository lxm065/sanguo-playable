"use strict";
const data = require("./expedition-data"),
  legacy = require("./roster"),
  policy = require("./expedition-config");
/** 从最低阶属性生成运行名册；旧存档诸葛亮只作兼容，不加入获取池。 */
module.exports = data.heroes
  .map((h) => {
    const t = h.tiers.find((t) => t.star === h.tier);
    return {
      ...h,
      ...t,
      id: h.id,
      interval: policy.localCombat.interval,
      skill: "strike",
      skillEvery: policy.localCombat.skillEvery,
      skillPower: policy.localCombat.skillPower,
      skillName: t.skills[0]?.name || "攻击",
      description: t.skills.map((s) => s.description).join("\n"),
    };
  })
  .concat(
    legacy
      .filter((h) => h.id === "zhugeliang")
      .map((h) => ({ ...h, legacy: true, tier: 1, faction: "蜀" })),
  );
