"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
const roster = require("../game/play/expedition-roster"),
  rules = require("../game/play/config"),
  policy = require("../game/play/expedition-config"),
  appearance = require("../game/play/battle-appearance");
const { Expedition } = require("../game/play/expedition"),
  { attach } = require("../game/play/classic-hooks"),
  {
    unitDetails,
    skillRows,
    wrapDescription,
  } = require("../game/play/unit-details"),
  { simulate } = require("../game/play/expedition-combat"),
  { direction, animationKey } = require("../game/play/model-animation");
/** 独立内存夹具不接触微信玩家存档。 */
function fixture() {
  const m = new Expedition(
    { ...rules, maxStar: 5, startingRoster: policy.initialRoster },
    roster,
    { read: () => null, write: () => {} },
  );
  attach(m, roster);
  return m;
}
test("全部武将每阶完整技能可以在单页容纳，不丢失文字", () => {
  for (const h of roster.filter((h) => !h.legacy))
    for (const tier of h.tiers) {
      const rows = skillRows(tier.skills);
      assert(
        rows.at(-1).bottom >=
          require("../game/play/battle-hud-config").detail.bottom,
        h.id + " " + tier.star,
      );
      for (const row of rows)
        assert.equal(row.lines.join(""), row.description.replace(/\n/g, ""));
    }
  assert.deepEqual(wrapDescription("攻击\n恢复"), ["攻击", "恢复"]);
});
test("敌我详情属性与实际开战快照一致，浏览不写阵容或战果", () => {
  const m = fixture(),
    before = JSON.stringify(m.state),
    enemies = m.enemies(),
    b = simulate(
      m.state.units,
      enemies,
      roster,
      rules,
      42,
      rules.enemyBaseScale,
    );
  for (const u of [...m.state.units, ...enemies]) {
    const d = unitDetails(m, u.heroId, u.uid),
      initial = b.initial.find((v) => v.uid === u.uid);
    for (const k of ["attack", "armor", "magicArmor", "range"])
      assert.equal(d.value[k], initial[k]);
    assert.equal(d.value.hp, initial.maxHp);
  }
  assert.equal(JSON.stringify(m.state), before);
});
test("八向朝向与镜像选择一致，待机方向不被零向量重置", () => {
  for (const [x, y, d] of [
    [1, 0, "e"],
    [1, 1, "ne"],
    [0, 1, "n"],
    [-1, 1, "nw"],
    [-1, 0, "w"],
    [-1, -1, "sw"],
    [0, -1, "s"],
    [1, -1, "se"],
  ])
    assert.equal(direction(x, y), d);
  assert.equal(direction(0, 0, "sw"), "sw");
  assert.equal(animationKey("skill1", "nw", true), "skill1-ne");
  assert.equal(animationKey("idle", "n", false), "idle");
});
test("近战远程法系普通攻击均遵守各阶实际射程", () => {
  const ranges = new Set(),
    magic = new Set();
  for (const h of roster.filter((h) => !h.legacy)) {
    const b = simulate(
        [{ uid: 1, heroId: h.id, star: h.tier, slot: 0 }],
        [{ uid: -1, heroId: "xuchu", star: 3, slot: 4 }],
        roster,
        rules,
        15,
        1,
      ),
      positions = new Map(b.initial.map((u) => [u.uid, { ...u }]));
    for (const e of b.events) {
      if (e.type === "move")
        Object.assign(positions.get(e.uid), { x: e.x, y: e.y });
      if (e.type === "attack" && !e.skill) {
        const a = positions.get(e.uid),
          target = positions.get(e.target);
        assert(
          Math.abs(a.x - target.x) + Math.abs(a.y - target.y) <= a.range,
          h.id,
        );
        assert.equal(e.ranged, a.range > 1);
        ranges.add(a.range);
        magic.add(!!a.magic);
      }
    }
  }
  assert(ranges.size >= 3);
  assert.equal(magic.size, 2);
});
test("17名对应模型和4名待制作严格分离，每套具备五方向完整动作", () => {
  assert.equal(Object.keys(appearance.models).length, 17);
  assert.deepEqual(appearance.pending, [
    "taishici",
    "ganning",
    "zhangjiao",
    "yanliang",
  ]);
  for (const [id, entry] of Object.entries(appearance.models)) {
    assert(!appearance.pending.includes(id));
    const dir = path.resolve(__dirname, "../game/skin-assets"),
      manifest = JSON.parse(
        fs.readFileSync(
          path.join(dir, entry.assetKey + "-manifest.json"),
          "utf8",
        ),
      ),
      skeleton = JSON.parse(
        fs.readFileSync(path.join(dir, entry.assetKey + ".json"), "utf8"),
      );
    for (const action of ["idle", "run", "skill1", "skill2", "dead"])
      for (const facing of ["s", "se", "e", "ne", "n"])
        assert(
          skeleton.animations[action + "-" + facing],
          id + " " + action + " " + facing,
        );
    for (const file of manifest.textures)
      assert(fs.statSync(path.join(dir, file)).size > 0);
    for (const box of Object.values(manifest.anchors)) {
      assert(box.height * manifest.scale <= 110.01);
      assert(box.width * manifest.scale <= 98.01);
    }
  }
});

test("新局三人上阵后切换低人口主公可正常完成，超额武将回备战席", () => {
  const m = fixture(),
    lords = require("../game/play/classic-config");
  m.transact(() => {
    m.state.meta.cleared = 60;
    m.state.meta.signs = 20;
  });
  const lord = lords.lords.find((l) => !lords.lordArmyBonus[l.id]);
  m.progression.select(lord.id);
  assert.equal(m.state.units.length, 3);
  assert.equal(m.state.units.filter((u) => u.slot >= 0).length, m.limit());
});
