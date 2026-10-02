"use strict";
const { random, distance, nextStep } = require("./combat"),
  { stats, bonds } = require("./expedition-stats"),
  policy = require("./expedition-config");
/** 创建独立战斗快照；旧低阶角色继续可用，面板属性由共用查询层计算。 */
function prepare(units, side, roster, rules, scale, equipment) {
  return units.map((u) => {
    const h = stats(u, units, roster, equipment, rules),
      hp = Math.round(h.hp * scale);
    return {
      ...h,
      ...u,
      side,
      hp,
      maxHp: hp,
      attack: h.attack * scale,
      x: u.slot % rules.columns,
      y:
        Math.floor(u.slot / rules.columns) +
        (side === "enemy" ? rules.rows : 0),
      nextAction: 0,
      attacks: 0,
      nextSkill: h.skills?.[0]?.cooldown || 0,
      stunnedUntil: 0,
      slowUntil: 0,
      slow: 0,
      nextRegen: 1,
      magicArmor: h.magicArmor || 0,
    };
  });
}
/** 提供战斗与属性弹窗共享的只读初始属性快照。 */
function prepareBattle(allies, enemies, roster, rules, scale, equipment = []) {
  const units = [
    ...prepare(allies, "ally", roster, rules, 1, equipment),
    ...prepare(enemies, "enemy", roster, rules, scale, []),
  ];
  for (const side of ["ally", "enemy"])
    for (const b of bonds(side === "ally" ? allies : enemies, roster)) {
      if (!b.level) continue;
      for (const u of units.filter((u) => u.side !== side)) {
        if (b.id === "qun") u.armor -= b.amount;
        if (b.id === "strategist") u.magicArmor -= b.amount;
      }
    }
  return units;
}
/** 本地确定性演算；主技能使用恢复的倍率，服务端时序与次级技能尚未完整恢复。 */
function simulate(allies, enemies, roster, rules, seed, scale, equipment = []) {
  const units = prepareBattle(allies, enemies, roster, rules, scale, equipment),
    rng = random(seed),
    events = [],
    hits = [];
  const initial = JSON.parse(JSON.stringify(units));
  let result = "draw",
    elapsed = 0;
  /** 回复事件与伤害事件共用时间轴，不将临时生命回写存档。 */
  function heal(u, amount, t) {
    if (u.hp <= 0) return;
    const gain = Math.min(u.maxHp - u.hp, Math.round(amount));
    if (gain <= 0) return;
    u.hp += gain;
    events.push({ type: "heal", t, target: u.uid, hp: u.hp, amount: gain });
  }
  /** 统一生命扣减与死亡，抵挡、反伤、吸血只在命中后计算。 */
  function damage(
    a,
    u,
    amount,
    t,
    skill = false,
    critical = false,
    reflect = true,
  ) {
    const actual = Math.max(
      rules.minDamage,
      Math.round((amount - u.block) * (1 - Math.min(0.9, u.reduction))),
    );
    u.hp = Math.max(0, u.hp - actual);
    events.push({
      type: "damage",
      t,
      actor: a.uid,
      target: u.uid,
      damage: actual,
      hp: u.hp,
      skill,
      critical,
    });
    if (!u.hp) events.push({ type: "death", t, uid: u.uid });
    if (reflect && !a.magic && u.reflect && a.hp > 0)
      damage(u, a, actual * u.reflect, t, false, false, false);
    if (!a.magic && a.leech) heal(a, actual * a.leech, t);
  }
  for (
    let step = 0;
    step <= Math.ceil(rules.maxBattleSeconds / rules.tickSeconds);
    step++
  ) {
    const t = +(step * rules.tickSeconds).toFixed(4);
    elapsed = t;
    for (let i = 0; i < hits.length; ) {
      const hit = hits[i];
      if (hit.at > t) {
        i++;
        continue;
      }
      hits.splice(i, 1);
      const { a, u, s } = hit;
      if (u.hp <= 0) continue;
      const armor = s.trueDamage ? 0 : a.magic ? u.magicArmor : u.armor;
      damage(
        a,
        u,
        (hit.power * a.attack * rules.armorScale) /
          (rules.armorScale + Math.max(policy.localCombat.armorFloor, armor)),
        t,
        hit.skill,
        hit.critical,
      );
      if (u.hp > 0) {
        if (s.stun) u.stunnedUntil = Math.max(u.stunnedUntil, t + s.stun);
        if (s.slow) {
          u.slow = s.slow;
          u.slowUntil = t + s.duration;
        }
        if (s.delay) u.nextSkill += s.delay;
        if (s.armorBreak) {
          u.armor += (u.restoreArmor?.value || 0) - s.armorBreak;
          u.restoreArmor = { at: t + s.duration, value: s.armorBreak };
        }
        if (s.magicBreak) {
          u.magicArmor += (u.restoreMagic?.value || 0) - s.magicBreak;
          u.restoreMagic = { at: t + s.duration, value: s.magicBreak };
        }
        if (s.pull) {
          const neighbors = [
            { x: a.x - 1, y: a.y },
            { x: a.x + 1, y: a.y },
            { x: a.x, y: a.y - 1 },
            { x: a.x, y: a.y + 1 },
          ];
          const free = neighbors.find(
            (p) =>
              p.x >= 0 &&
              p.x < rules.columns &&
              p.y >= 0 &&
              p.y < rules.rows * 2 &&
              !units.some((v) => v.hp > 0 && v.x === p.x && v.y === p.y),
          );
          if (free) {
            Object.assign(u, free);
            events.push({
              type: "move",
              t,
              uid: u.uid,
              ...free,
              duration: rules.moveSeconds,
            });
          }
        }
      }
      if (s.drain) heal(a, a.attack * hit.power, t);
      const counter = policy.primarySkills[u.heroId];
      if (u.hp > 0 && counter?.passive === "counter" && rng() < counter.chance)
        for (const v of units.filter(
          (v) =>
            v.side !== u.side && v.hp > 0 && distance(v, u) <= counter.radius,
        ))
          damage(u, v, u.attack * counter.power, t, true, false, false);
    }
    const alive = (side) => units.some((u) => u.side === side && u.hp > 0);
    if (!alive("ally") || !alive("enemy")) {
      result = alive("ally") ? "win" : alive("enemy") ? "loss" : "draw";
      break;
    }
    for (const a of units) {
      if (a.hp <= 0) continue;
      if (a.restoreArmor?.at <= t) {
        a.armor += a.restoreArmor.value;
        a.restoreArmor = null;
      }
      if (a.restoreMagic?.at <= t) {
        a.magicArmor += a.restoreMagic.value;
        a.restoreMagic = null;
      }
      if (a.nextRegen <= t) {
        heal(a, a.regen + a.regenPercent * a.maxHp, t);
        if (a.healPulse && Math.floor(t) % a.healInterval === 0)
          heal(a, a.healPulse, t);
        a.nextRegen++;
      }
      if (a.nextAction > t || a.stunnedUntil > t) continue;
      const spec =
          policy.primarySkills[a.heroId] ||
          (a.legacy
            ? { power: a.skillPower, radius: a.skill === "cleave" ? 1 : 0 }
            : {}),
        targets = units
          .filter((u) => u.side !== a.side && u.hp > 0)
          .sort((a1, b) => distance(a, a1) - distance(a, b) || a1.uid - b.uid);
      let target = targets[0];
      const skill = a.legacy
        ? (a.attacks + 1) % a.skillEvery === 0
        : !spec.passive && a.nextSkill <= t;
      if (skill && spec.heal) {
        for (const u of units.filter((u) => u.side === a.side))
          heal(u, a.attack * spec.heal, t);
        a.nextSkill = t + (a.skills?.[0]?.cooldown || rules.moveSeconds);
        a.nextAction = t + a.interval;
        events.push({
          type: "attack",
          t,
          uid: a.uid,
          target: a.uid,
          skill: true,
          skillName: a.skills?.[0]?.name,
        });
        continue;
      }
      if (skill && spec.farthest) target = targets[targets.length - 1];
      if (skill && spec.highestHp)
        target = [...targets].sort((a, b) => b.hp - a.hp)[0];
      if (
        distance(a, target) > a.range &&
        (!skill || !(spec.farthest || spec.highestHp || spec.line))
      ) {
        const next = nextStep(a, target, units, rules);
        if (next) {
          Object.assign(a, next);
          events.push({
            type: "move",
            t,
            uid: a.uid,
            ...next,
            duration: rules.moveSeconds,
          });
        }
        a.nextAction = t + rules.moveSeconds;
        continue;
      }
      let s = skill ? spec : spec.passive ? spec : {},
        power = skill ? s.power || 1 : 1;
      if (s.passive === "bonus") power = s.power;
      if (s.passive === "bash") {
        if (rng() < s.chance) power = s.power;
        else s = {};
      }
      if (s.passive === "counter") s = {};
      const critical = rng() < rules.criticalChance + a.critical;
      if (critical) power *= rules.criticalMultiplier + a.criticalBonus;
      a.attacks++;
      const affected =
        skill && (s.radius || s.line)
          ? targets.filter((v) =>
              s.line
                ? v.x === target.x || v.y === target.y
                : distance(v, s.selfCenter ? a : target) <= s.radius,
            )
          : [target];
      events.push({
        type: "attack",
        t,
        uid: a.uid,
        target: target.uid,
        skill,
        skillName: a.skills?.[0]?.name || a.skillName,
        ranged: a.range > 1,
      });
      for (const u of affected)
        hits.push({
          at: t + rules.attackDelay,
          a,
          u,
          s,
          power,
          skill,
          critical,
        });
      a.nextAction = t + a.interval / (a.slowUntil > t ? 1 - a.slow : 1);
      if (skill)
        a.nextSkill =
          t + (a.skills?.[0]?.cooldown || policy.localCombat.interval);
    }
  }
  return {
    initial,
    events,
    result,
    duration: elapsed,
    final: units.map((u) => ({ uid: u.uid, hp: u.hp, x: u.x, y: u.y })),
  };
}
module.exports = { simulate, prepareBattle };
