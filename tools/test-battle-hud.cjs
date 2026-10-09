"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  {
    recommendedUnits,
    equipmentTarget,
    lordSummary,
  } = require("../game/play/battle-hud-query"),
  config = require("../game/play/battle-hud-config"),
  policy = require("../game/play/expedition-config");
test("推荐包含备战席同名实例，满槽保留但非推荐角色排除且查询只读", () => {
  const units = [
      { uid: 1, heroId: "guanyu", slot: 0 },
      { uid: 2, heroId: "xuchu", slot: -1 },
      { uid: 3, heroId: "zhenji", slot: 1 },
      { uid: 4, heroId: "guanyu", slot: 2 },
    ],
    equipment = [
      { uid: 1, id: "7212", owner: null },
      ...Array.from({ length: 3 }, (_, i) => ({
        uid: i + 2,
        id: "7206",
        owner: 4,
      })),
    ],
    before = JSON.stringify({ units, equipment });
  assert.deepEqual(recommendedUnits(equipment[0], units, equipment), [1, 2, 4]);
  assert.equal(JSON.stringify({ units, equipment }), before);
});
test("拖动命中显示中的己方单位，空白落点不误穿戴", () => {
  const positions = [
    { uid: 1, x: -50, y: 0, scale: 0.85 },
    { uid: 2, x: 100, y: -350, scale: 0.64 },
  ];
  assert.equal(equipmentTarget({ x: -50, y: 35 }, positions), 1);
  assert.equal(equipmentTarget({ x: 100, y: -315 }, positions), 2);
  assert.equal(equipmentTarget({ x: 310, y: 320 }, positions), null);
  assert.equal(equipmentTarget({ x: -50, y: -35 }, positions), 1);
  assert.equal(equipmentTarget({ x: -50, y: -50 }, positions), null);
  assert.equal(equipmentTarget({ x: 100, y: -200 }, positions), null);
});
test("八个徽章与两行装备图标均在预留范围内", () => {
  const b = config.bonds,
    e = config.equipment;
  assert.equal(Object.keys(b.symbols).length, 8);
  for (const [symbol] of Object.values(b.symbols))
    assert.equal([...symbol].length, 1);
  assert(b.x - b.size / 2 > -275);
  assert(b.x + 7 * b.gap + b.size / 2 < 350);
  assert(e.x + (e.columns - 1) * e.gap + e.size / 2 < 114);
  assert(e.y - (e.rows - 1) * e.rowGap - e.size / 2 > -630);
  assert(b.countX + 12.5 < b.size / 2 + 8);
});
test("主公概率与刷新策略一致，经验与人数不修改存档", () => {
  const model = {
      state: { expedition: { level: 2, experience: 10 } },
      limit: () => 3,
    },
    before = JSON.stringify(model.state),
    s = lordSummary(model);
  assert.equal(s.nextExperience, 300);
  assert.equal(s.limit, 3);
  assert.equal(s.ranks.find((r) => r.star === policy.refreshRank).percent, 100);
  assert.equal(
    s.ranks.reduce((n, r) => n + (r.percent || 0), 0),
    100,
  );
  assert.equal(s.ranks.find((r) => r.star === 3).percent, null);
  assert.equal(JSON.stringify(model.state), before);
});
test("装备推荐配置覆盖当前掉落池且人物身份均有效", () => {
  const heroes = require("../game/play/handbook-config").heroes;
  for (const item of policy.equipment) {
    assert(require('../game/play/equipment-recommendations').heroIds(item.id).length);
    assert.equal(
      new Set(require('../game/play/equipment-recommendations').heroIds(item.id)).size,
      require('../game/play/equipment-recommendations').heroIds(item.id).length,
    );
    for (const id of require('../game/play/equipment-recommendations').heroIds(item.id))
      assert(heroes.some((h) => h.id === id));
  }
});
test("节点外松手提交穿戴，系统取消与空白落点不提交", () => {
  const { BattleHud } = require("../game/play/battle-hud"),
    events = {
      TOUCH_START: "start",
      TOUCH_MOVE: "move",
      TOUCH_END: "end",
      TOUCH_CANCEL: "cancel",
    },
    handlers = {},
    calls = [],
    view = {
      cc: { Node: { EventType: events }, Input: { EventType: events } },
      config: { layout: { dragThreshold: 14 } },
      model: {
        state: { pending: null },
        equip: (item, unit) => calls.push([item, unit]),
      },
      act: (fn) => fn(),
      render: () => {},
      equipmentDetails: () => {},
    };
  const hud = new BattleHud(view);
  hud.point = (e) => e.point;
  hud.positions = () => [{ uid: 7, x: 100, y: 100, scale: 1 }];
  hud.beginDrag = () => {};
  hud.bindEquipment(
    { on: (name, fn) => (handlers[name] = fn) },
    { uid: 3, id: "7212" },
  );
  const event = (x, y, code) => ({ point: { x, y }, getEventCode: () => code });
  handlers.start(event(0, 0));
  handlers.move(event(100, 150));
  handlers.cancel(event(100, 150, "end"));
  assert.deepEqual(calls, [[3, 7]]);
  handlers.start(event(0, 0));
  handlers.move(event(100, 150));
  handlers.cancel(event(100, 150, "cancel"));
  assert.equal(calls.length, 1);
  handlers.start(event(0, 0));
  handlers.move(event(300, 300));
  handlers.cancel(event(300, 300, "end"));
  assert.equal(calls.length, 1);
});
