"use strict";
const fs = require("node:fs"),
  path = require("node:path");
const handbook = require("../game/play/handbook-config");
/** 从只读原始配置导出阶级属性与技能说明，服务端未恢复的算法不冒充原始规则。 */
function main() {
  const root = path.resolve(__dirname, "../../策划资料库/原始配置");
  const read = (name) =>
    JSON.parse(fs.readFileSync(path.join(root, name + "_cfg.json"), "utf8"));
  const source = read("hero"),
    skills = read("hero_skill");
  const heroes = handbook.heroes.map((h) => ({
    ...h,
    tiers: Object.values(source)
      .filter(
        (v) =>
          /^1[1-5][0-9]{2}$/.test(v.hero_id) &&
          v.hero_id.slice(-2) === h.sourceId.slice(-2) &&
          Number(v.color) <= 5,
      )
      .map((v) => ({
        star: Number(v.color),
        sourceId: v.hero_id,
        hp: Number(v.hp),
        attack: Number(v.phy_att),
        armor: Number(v.phy_def),
        magicArmor: Number(v.stg_def),
        range: Number(v.attack_distance),
        magic: v.att_type === "1",
        skills: [1, 2, 3, 4]
          .map((i) => skills[v["skill_id_" + i]])
          .filter(Boolean)
          .map((s) => ({
            id: s.skill_id,
            name: s.name,
            cooldown: Number(s.skill_cd) / 10,
            description: s.des,
          })),
      }))
      .sort((a, b) => a.star - b.star),
  }));
  fs.writeFileSync(
    path.resolve(__dirname, "../game/play/expedition-data.js"),
    "/** 原始配置的只读导出；由 tools/export-expedition.cjs 生成。 */\nmodule.exports=" +
      JSON.stringify(
        {
          provenance:
            "策划资料库/原始配置/hero_cfg.json + hero_skill_cfg.json；仅属性和技能说明，非原服务端模拟器",
          heroes,
        },
        null,
        2,
      ),
  );
}
main();
