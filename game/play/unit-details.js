"use strict";
const { stats } = require("./expedition-stats"),
  { prepareBattle } = require("./expedition-combat"),
  layout = require("./battle-hud-config").detail;
/** 中英文按显示宽度分行，保留全部技能说明且不缩字、不翻页。 */
function wrapDescription(
  text,
  width = layout.skillWidth,
  font = layout.bodyFont,
) {
  const max = width / font - layout.wrapPadding,
    lines = [];
  let line = "",
    used = 0;
  for (const ch of String(text || "")) {
    if (ch === "\n") {
      lines.push(line);
      line = "";
      used = 0;
      continue;
    }
    const size = ch.charCodeAt(0) < 128 ? 0.56 : 1;
    if (used + size > max && line) {
      lines.push(line);
      line = "";
      used = 0;
    }
    line += ch;
    used += size;
  }
  if (line) lines.push(line);
  return lines;
}
/** 根据完整文案计算各技能位置，单页垂直空间留给实际行数。 */
function skillRows(skills) {
  let top = layout.skillsTop;
  return skills.map((skill) => {
    const lines = wrapDescription(skill.description),
      height = lines.length * layout.lineHeight + 6,
      row = {
        ...skill,
        lines,
        titleY: top - layout.titleHeight / 2,
        bodyY: top - layout.titleHeight - height / 2,
        bodyHeight: height,
        bottom: top - layout.titleHeight - height,
      };
    top = row.bottom - layout.gap;
    return row;
  });
}
/** 敌我属性读取同一战斗准备快照，敌方缩放与羁绊减防不另写一套公式。 */
function unitDetails(model, id, uid, snapshot = null) {
  const own = model.state.units.find((u) => u.uid === uid),
    enemy = !own && model.enemies().find((u) => u.uid === uid),
    hero = model.roster.find((h) => h.id === id),
    unit = own ||
      enemy || { uid: 0, heroId: id, star: hero.tier || 1, slot: -1 };
  let value = snapshot;
  if (!value && unit.slot >= 0) {
    const r = model.rules,
      scale = Math.min(
        r.enemyMaxScale,
        r.enemyBaseScale + (model.state.stage - 1) * r.enemyGrowth,
      );
    value = prepareBattle(
      model.state.units.filter((u) => u.slot >= 0),
      model.enemies(),
      model.roster,
      r,
      scale,
      model.state.expedition.equipment,
    ).find((u) => u.uid === unit.uid);
  }
  if (!value)
    value = stats(
      unit,
      [unit],
      model.roster,
      own ? model.state.expedition.equipment : [],
      model.rules,
    );
  return {
    unit,
    value,
    enemy: uid < 0,
    items: own
      ? model.state.expedition.equipment.filter((e) => e.owner === own.uid)
      : [],
    skills: value.skills || [
      { name: value.skillName, cooldown: 0, description: value.description },
    ],
  };
}
/** 渲染敌我通用的只读单页；装备只展示，不在属性页加入阵容管理。 */
function showUnitDetails(view, id, uid = null, snapshot = null) {
  const data = unitDetails(view.model, id, uid, snapshot),
    { value, unit } = data,
    u = view.ui,
    c = layout,
    m = view.overlay(),
    card = view.paper(m, "unit-property-sheet", c.x, 0, c.width, c.height);
  card.addComponent(view.cc.BlockInputEvents);
  u.text(
    card,
    unit.star + "阶  " + value.name,
    0,
    c.titleY,
    35,
    c.gradeColors[unit.star - 1],
    c.width - 30,
  );
  u.image(
    card,
    id + "-avatar.png",
    0,
    c.portraitY,
    c.portraitSize,
    c.portraitSize,
  );
  u.text(
    card,
    (data.enemy ? "敌军 · " : "") +
      (value.faction || "") +
      "  " +
      value.role +
      "  射程 " +
      value.range,
    0,
    c.traitsY,
    27,
    "#503721",
    c.width - 35,
  );
  u.text(
    card,
    "生命 " +
      Math.round(value.maxHp || value.hp) +
      "    攻击 " +
      Math.round(value.attack) +
      "\n物防 " +
      value.armor +
      "    魔防 " +
      (value.magicArmor || 0),
    0,
    c.statsY,
    27,
    "#503721",
    c.width - 40,
    88,
  );
  u.text(card, "技能", 0, c.skillsTitleY, 28, "#604326", c.width - 35);
  for (const row of skillRows(data.skills)) {
    const title = u.text(
      card,
      row.name + (row.cooldown ? " · " + row.cooldown + "秒" : " · 被动"),
      0,
      row.titleY,
      c.titleFont,
      "#376326",
      c.skillWidth,
      c.titleHeight,
    );
    title.horizontalAlign = view.cc.Label.HorizontalAlign.LEFT;
    const body = u.text(
      card,
      row.lines.join("\n"),
      0,
      row.bodyY,
      c.bodyFont,
      "#503C28",
      c.skillWidth,
      row.bodyHeight,
    );
    body.lineHeight = c.lineHeight;
    body.enableWrapText = false;
    body.horizontalAlign = view.cc.Label.HorizontalAlign.LEFT;
  }
  u.text(m, "装备", c.equipmentX, c.equipmentY + 69, 25, "#F7E8CB", 90);
  for (let i = 0; i < require("./expedition-config").equipmentLimit; i++) {
    const item = data.items[i],
      y = c.equipmentY - i * c.equipmentGap;
    u.box(
      m,
      "property-equipment-" + i,
      c.equipmentX,
      y,
      c.equipmentSize,
      c.equipmentSize,
      "#332D25AA",
    );
    if (item)
      u.image(
        m,
        "equipment/" + item.id + ".png",
        c.equipmentX,
        y,
        c.equipmentSize - 7,
        c.equipmentSize - 7,
      );
  }
  u.text(m, "点击空白处关闭", 0, c.closeY, 27, "#F8ECD7", 520);
  m.on(view.cc.Node.EventType.TOUCH_END, (e) => {
    if (e.target === m) {
      m.destroy();
      view.modal = null;
    }
  });
  return data;
}
module.exports = { wrapDescription, skillRows, unitDetails, showUnitDetails };
