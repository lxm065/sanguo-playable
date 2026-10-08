"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict"),
  { Expedition } = require("../game/play/expedition"),
  roster = require("../game/play/expedition-roster"),
  policy = require("../game/play/expedition-config"),
  base = require("../game/play/config"),
  { attach } = require("../game/play/classic-hooks"),
  { simulate } = require("../game/play/expedition-combat"),
  { bonds, stats } = require("../game/play/expedition-stats");
/** 创建独立存储夹具，不读取或覆盖玩家存档。 */
function fixture() {
  let saved = null,
    fail = false,
    writes = 0;
  const storage = {
      read: () => structuredClone(saved),
      write: (s) => {
        if (fail) throw Error("磁盘失败");
        saved = structuredClone(s);
        writes++;
      },
    },
    rules = { ...base, maxStar: 5, startingRoster: policy.initialRoster },
    m = new Expedition(rules, roster, storage);
  attach(m, roster);
  return {
    m,
    reload: () => {
      const m = new Expedition(rules, roster, storage);
      attach(m, roster);
      return m;
    },
    fail: () => (fail = true),
    writes: () => writes,
  };
}
/** 使用确定胜利战报隔离奖励测试与战斗平衡。 */
function victory(m, type = "battle") {
  m.deploy(1, 0);
  const node = m.progression.nodes().find((n) => n.type === type);
  m.transact(() => {
    m.state.meta.layer = node.row;
    m.state.meta.activeNode = node.id;
  });
  m.simulator = () => ({
    initial: [],
    events: [],
    final: [],
    result: "win",
    duration: 1,
  });
  m.fight();
}
test("21人名册有各阶属性，六名女性且诸葛亮只兼容旧档", () => {
  assert.equal(roster.filter((h) => !h.legacy).length, 21);
  assert.equal(roster.filter((h) => h.gender === "女").length, 6);
  for (const h of roster.filter((h) => !h.legacy)) {
    assert(h.tiers.some((t) => t.star === h.tier));
    assert(h.tiers.every((t) => t.hp > 0 && t.attack > 0));
  }
  assert(
    !fixture()
      .m.availableRoster()
      .some((h) => h.id === "zhugeliang"),
  );
});
test("普通奖励三选一与二阶广告刷新可恢复且只领取一次", () => {
  const f = fixture(),
    m = f.m;
  victory(m);
  assert.equal(m.state.pending.rewardKind, "heroes");
  assert.equal(m.state.pending.choices.length, 3);
  const ticket = m.adTicket();
  m.refreshReward(ticket);
  assert.equal(m.state.pending.rewardStar, 2);
  assert.throws(() => m.refreshReward(ticket), /已领取/);
  const restored = f.reload();
  assert.deepEqual(restored.state.pending, m.state.pending);
  restored.claim(0);
  assert.equal(restored.state.units.at(-1).star, 2);
  const after = structuredClone(restored.state);
  assert.equal(restored.claim(0), false);
  assert.deepEqual(restored.state, after);
});
test("精英胜利只发一件装备，发奖和战果同一次写盘", () => {
  const f = fixture(),
    m = f.m;
  victory(m, "elite");
  assert.equal(m.state.pending.rewardKind, "equipment");
  assert.deepEqual(m.state.pending.choices, []);
  const before = f.writes();
  m.claim();
  assert.equal(f.writes(), before + 1);
  assert.equal(m.state.expedition.equipment.length, 1);
});
test("三件上限、转移、卸下与合成装备返还", () => {
  const { m } = fixture();
  m.transact(() => {
    for (let i = 0; i < 4; i++) m.addEquipment("7212");
  });
  for (let i = 1; i <= 3; i++) m.equip(i, 1);
  assert.throws(() => m.equip(4, 1), /最多/);
  m.equip(4, 2);
  m.merge(1);
  assert.equal(m.state.units.length, 1);
  assert.equal(
    m.state.expedition.equipment.find((e) => e.uid === 4).owner,
    null,
  );
  m.equip(1, null);
  m.equip(4, 1);
  assert.equal(
    m.state.expedition.equipment.filter((e) => e.owner === 1).length,
    3,
  );
});
test("新人福利按三星关羽、龙心、钻石顺序，旧凭据不可重放", () => {
  const { m } = fixture(),
    t = m.adTicket();
  m.claimNovice(t);
  assert.equal(m.state.units.at(-1).heroId, "guanyu");
  assert.equal(m.state.units.at(-1).star, 3);
  assert.throws(() => m.claimNovice(t), /已领取/);
  m.claimNovice(m.adTicket());
  assert.equal(m.state.expedition.equipment[0].id, "7212");
  const d = m.state.meta.diamonds;
  m.claimNovice(m.adTicket());
  assert.equal(m.state.meta.diamonds, d + 10000);
});
test("定向合成仅允许候选且交易失败回滚全部状态", () => {
  const f = fixture(),
    m = f.m;
  m.state.meta.layer = 1;
  const t = m.adTicket(),
    target = m.directedTargets(1)[0];
  assert.throws(() => m.merge(1, "directed", "lvbu", t), /失效/);
  const before = structuredClone(m.state);
  f.fail();
  assert.throws(() => m.merge(1, "directed", target, t), /磁盘/);
  assert.deepEqual(m.state, before);
});
test("同名多阶不叠羁绊、装备属性在详情和战斗一致", () => {
  const units = [
    { uid: 1, heroId: "xuchu", star: 1, slot: 0 },
    { uid: 2, heroId: "xuchu", star: 2, slot: 1 },
    { uid: 3, heroId: "zhenji", star: 1, slot: 2 },
  ];
  assert.equal(bonds(units, roster).find((b) => b.id === "wei").count, 2);
  assert.equal(bonds(units, roster).find((b) => b.id === "warrior").level, 0);
  const e = [{ uid: 1, id: "7212", owner: 1 }],
    s = stats(units[0], units, roster, e, base),
    b = simulate(
      units,
      [{ uid: -1, heroId: "xuchu", star: 1, slot: 1 }],
      roster,
      base,
      100,
      1,
      e,
    );
  assert.equal(b.initial[0].maxHp, s.hp);
  assert.deepEqual(
    b,
    simulate(
      units,
      [{ uid: -1, heroId: "xuchu", star: 1, slot: 1 }],
      roster,
      base,
      100,
      1,
      e,
    ),
  );
  assert(b.events.some((e) => e.type === "heal"));
  assert(b.final.every((u) => u.hp >= 0 && Number.isFinite(u.hp)));
});
test("所有21人各阶本地战斗无NaN且读查询不改变存档", () => {
  for (const h of roster.filter((h) => !h.legacy)) {
    const a = { uid: 1, heroId: h.id, star: h.tier, slot: 0 },
      e = { uid: -1, heroId: "xuchu", star: 2, slot: 0 };
    const b = simulate([a], [e], roster, base, 20, 1);
    assert(b.final.every((u) => Number.isFinite(u.hp)));
  }
  const { m } = fixture(),
    before = structuredClone(m.state);
  m.directedTargets(1);
  m.availableRoster();
  m.adTicket();
  assert.deepEqual(m.state, before);
});
test("显式有限容量兼容模式不吞奖励", () => {
  const { m } = fixture();
  m.rules={...m.rules,capacity:12};
  m.transact(() => {
    while (m.state.units.length < m.rules.capacity)
      m.state.units.push({
        uid: m.state.nextUid++,
        heroId: "xuchu",
        star: 1,
        slot: -1,
      });
  });
  victory(m);
  const before = structuredClone(m.state);
  assert.throws(() => m.claim(0), /已满/);
  assert.deepEqual(m.state, before);
  m.claim(null, true);
  assert.equal(m.state.pending, null);
  assert.equal(m.state.units.length, m.rules.capacity);
});
test("历史五人存档和待领奖继续兼容，不重置金币和阵容", () => {
  const { Campaign } = require("../game/play/campaign"),
    oldRoster = require("../game/play/roster");
  let saved;
  const old = new Campaign(base, oldRoster, {
    read: () => null,
    write: (s) => (saved = structuredClone(s)),
  });
  old.deploy(1, 0);
  old.fight();
  const units = structuredClone(old.state.units),
    gold = old.state.gold;
  const migrated = new Expedition(
    { ...base, maxStar: 5, startingRoster: policy.initialRoster },
    roster,
    { read: () => saved, write: (s) => (saved = structuredClone(s)) },
  );
  attach(migrated, roster);
  assert.deepEqual(migrated.state.units, units);
  assert.equal(migrated.state.gold, gold);
  assert(migrated.state.pending);
  migrated.claim(0);
  assert.equal(migrated.state.pending, null);
});
test("第18章才开放5阶，重开远征恢复局内新人福利", () => {
  const { m } = fixture();
  m.claimNovice(m.adTicket());
  assert.equal(m.maxRank(), 4);
  m.transact(() => {
    m.state.meta.cleared = 18;
    m.state.meta.hp = 0;
  });
  assert.equal(m.maxRank(), 5);
  m.progression.restart();
  assert.equal(m.state.expedition.novice, 0);
});
test("首胜100经验跨过90门槛，上阵上限与存档校验同步", () => {
  const { m } = fixture();
  assert.equal(m.state.units.filter(u=>u.slot>=0).length,0);
  m.state.units.forEach((u,i)=>m.deploy(u.uid,i));
  assert.equal(m.canDirect(), false);
  assert.equal(m.limit(), 3);
  assert.equal(m.state.units.filter((u) => u.slot >= 0).length, 3);
  victory(m);
  m.claim(0);
  assert.equal(m.state.expedition.level, 2);
  assert.equal(m.state.expedition.experience, 10);
  assert.equal(m.limit(), 3);
  assert.throws(()=>m.deploy(4,4),/人数已满/);
  m.state.expedition.level=3;
  m.deploy(4,4);
  assert.equal(m.limit(),4);
  assert.equal(m.state.units.filter((u) => u.slot >= 0).length,4);
  assert.equal(m.canDirect(), true);
});
