"use strict";
const { random, distance, approachStep } = require("./combat"),
  { stats, bonds } = require("./expedition-stats"),
  policy = require("./expedition-config");
/** 创建独立战斗快照；旧低阶角色继续可用，面板属性由共用查询层计算。 */
function prepare(units, side, roster, rules, scale, equipment) {
  return units.map((u) => {
    const h = stats(u, units, roster, equipment, side === "ally" ? rules : {...rules,playerBonds:undefined,playerEquipmentGrades:{},playerTalentTree:{},playerVip:null }),
      hp = Math.round(h.hp * scale);
    return {
      ...h,
      ...u,
      side,
      combatRelief:side==="enemy"?rules.enemyCombatRelief:null,
      talent:side==="ally"?(rules.playerTalent||{}):{},
      hp,
      maxHp: hp,
      attack: h.attack * scale,
      x: u.slot % rules.columns,
      y:
        Math.floor(u.slot / rules.columns) +
        (side === "enemy" ? rules.rows : 0),
      nextAction: 0,
      attacks: 0,
      nextSkill: policy.primarySkills[u.heroId]?.initialCooldown ?? h.skills?.[0]?.cooldown ?? 0,
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
    ...prepare(enemies, "enemy", roster, rules, scale, require("./enemy-equipment").collect(enemies)),
  ];
  for (const side of ["ally", "enemy"])
    for (const b of bonds(side === "ally" ? allies : enemies, roster,side==="ally"?rules.playerBonds:undefined)) {
      if (!b.level) continue;
      for (const u of units.filter((u) => u.side !== side)) {
        if (b.id === "qun") u.armor -= b.amount;
        if (b.id === "strategist") u.magicArmor -= b.amount;
      }
    }
  require("./talent-effects").enemies(units,rules.playerTalentTree);
  return units;
}
/** 本地确定性演算；前两章技能按独立规则调度，其他武将保留主技能兼容流程。 */
function simulate(allies, enemies, roster, rules, seed, scale, equipment = []) {
  const units = prepareBattle(allies, enemies, roster, rules, scale, equipment),
    rng = random(seed),
    events = [],
    hits = [];
  const exclusive=require('./weapon-exclusive'),charm=require('./charm-exclusive'),overtime=require('./battle-overtime');
  const protection=require('./combat-protection'),qinggang=require('./qinggang-skill'),survival=require('./xuchu-survival');
  const skills = require('./hero-skills'),talents=require('./talent-effects');
  skills.initialize(units,events);const equip=require('./equipment-effects');equip.initialize(units);require("./enemy-relief").stagger(units);
  const initial = JSON.parse(JSON.stringify(units));
  let result = "draw",
    elapsed = 0, overtimeStarted=false;
  /** 回复事件与伤害事件共用时间轴，不将临时生命回写存档。 */
  function heal(u, amount, t) {
    if (u.hp <= 0) return;
    const gain = Math.min(u.maxHp - u.hp, Math.round(amount*overtime.healingMultiplier(rules,t)*(u.side==="enemy"?(u.combatRelief?.healing??1):1)));
    if (gain <= 0) return;
    u.hp += gain;survival.healed(u,gain,t);
    events.push({ type: "heal", t, target: u.uid, hp: u.hp, amount: gain });
  }
  /** 普通击杀与保命到期共享死亡事件、被动和装备结算。 */
  function death(u,a,t){delete u.xuchuSurvival;exclusive.onDeath(u,units,t,hits,events);equip.death(u,a,units,t,events);events.push({type:'death',t,uid:u.uid,actor:a.uid});skills.onDeath(u,units,t,hits,heal,events);talents.death(u,units,t,heal);require('./machao-shield').death(u,units,t,events,damage,rules);}
  /** 无治疗的延迟死亡保留原致命伤来源，不再次经过伤害减免或触发保命。 */
  function survivalDeath(u,source,t){u.hp=0;death(u,units.find(a=>a.uid===source)||u,t);}
  /** 统一生命扣减与死亡，抵挡、反伤、吸血只在命中后计算。 */
  function damage(
    a,
    u,
    amount,
    t,
    skill = false,
    critical = false,
    reflect = true,
    effect = null,
    damageType = null,
    slashIndex = null,
    overtimeScaled = false,
  ) {
    if(u.hp<=0||protection.protectedUnit(u)||survival.invulnerable(u,t))return;const magic=damageType&&damageType!=='true'?damageType==='magic':require('./hero-damage').isMagic(a,skill);const up=(a.talent?.[magic?"magicUp":"physicalUp"]||0)+(a.talent?.[skill?"skillUp":"attackUp"]||0),down=(u.talent?.[magic?"magicDown":"physicalDown"]||0)+(u.talent?.[skill?"skillDown":"attackDown"]||0);
    amount*= (1+up)*(1-Math.min(require("./activity-config").talent.damageReductionCap,down));
    let actual = Math.max(
      rules.minDamage,
      Math.round((amount - u.block) * (1 - Math.min(0.9, u.reduction))),
    );
    const overtimeFactor=overtimeScaled?1:overtime.damageMultiplier(rules,t);actual*=overtimeFactor;
    actual=Math.max(0,Math.round(talents.damage(a,u,actual,critical,rng,magic)));
    if(effect==='healthLoss')actual=Math.round(amount*overtimeFactor);if(a.side!==u.side&&effect!=='healthLoss')require('./machao-shield').emergency(u,actual,t,events);const absorbed=effect==='healthLoss'?0:Math.min(actual,u.equipmentShield||0);u.equipmentShield=(u.equipmentShield||0)-absorbed;actual-=absorbed;if(absorbed>0)events.push({type:'shield',t,target:u.uid,amount:absorbed});actual=survival.intercept(a,u,actual,t,events,effect);u.hp = Math.max(0, u.hp - actual);require('./machao-shield').sync(u,t,events);
    events.push({
      type: "damage",
      t,
      actor: a.uid,
      target: u.uid,
      damage: actual,
      ...(slashIndex?{slashIndex}:{}),
      damageType:damageType||(magic?"magic":"physical"),
      hp: u.hp,
      skill,
      critical,
      effect,
    });
    if (!u.hp) death(u,a,t);
    if(!charm.active(a,t))talents.hit(a,u,actual,t,skill,critical,reflect,rng,heal,damage);
    if (reflect && !magic && u.reflect && a.hp > 0)
      damage(u, a, actual * u.reflect, t, false, false, false,null,null,null,true);
    if (!magic && a.leech&&reflect&&!skill){equip.leech(a,actual*a.leech*overtime.healingMultiplier(rules,t),t,events);heal(a, actual * a.leech, t);}if(!skill&&reflect&&a!==u&&!charm.active(a,t))equip.hit(a,u,actual,t,units,events,heal,damage,rng);
  }
  for (
    let step = 0;
    step <= Math.ceil(overtime.limit(rules) / rules.tickSeconds);
    step++
  ) {
    const t = +(step * rules.tickSeconds).toFixed(4);
    elapsed = t;
    if(overtime.active(rules,t)&&!overtimeStarted){overtimeStarted=true;events.push({type:'overtime',t,speedMultiplier:overtime.config(rules).speedMultiplier,damageMultiplier:overtime.config(rules).damageMultiplier});}
    for(const a of units)survival.tick(a,t,survivalDeath);
    for(const a of units)exclusive.opening(a,units,t,events);
    for(const a of units){charm.tick(a,t,events);if(!charm.active(a,t))qinggang.tick(a,units,t,hits,events,rules,rng);}
    for (let i = 0; i < hits.length; ) {
      const hit = hits[i];
      if (hit.at > t) {
        i++;
        continue;
      }
      hits.splice(i, 1);
      if(hit.cancelled)continue;
      if(hit.charm){charm.impact(hit,t,events,hits);continue;}
      if(!charm.validHit(hit,t))continue;
      if(hit.exclusiveArea){if(hit.a.hp>0)hits.splice(i,0,...exclusive.area(hit,units,t));continue;}
      if(hit.toss){hits.splice(i,0,...require('./dianwei-toss').impact(hit,units,t));continue;}
      const { a, u, s } = hit;
      if (u.hp <= 0 || (!hit.healPower&&protection.protectedUnit(u)) || (hit.channel && (a.hp<=0 || a.stunnedUntil>t || a.silencedUntil>t || a.channelInterruptedAt>=hit.channelStart))) continue;
      if(hit.healPower){if(a.hp>0)heal(u,a.attack*hit.healPower,t);continue;}
      if(!hit.skill&&!s.undodgeable&&u.bondDodge&&rng()<u.bondDodge){talents.onEvade(u,t,heal);events.push({type:'evade',t,target:u.uid});continue;}
      if(!hit.skill&&!s.undodgeable&&talents.evade(u,rng,t,heal)){events.push({type:'evade',t,target:u.uid});continue;}
      if(!hit.skill && !s.undodgeable && u.dodgeUntil>t && rng()<u.skillDodge){talents.onEvade(u,t,heal);events.push({type:'evade',t,target:u.uid});continue;}
      require('./zhangba-exclusive').beforeHit(hit,t,events);
      const magic=!s.physical&&require('./hero-damage').isMagic(a,hit.skill);
      const armor = s.trueDamage ? 0 : magic ? u.magicArmor-(a.magicPen||0) : u.armor;
      damage(
        a,
        u,
        (hit.flatDamage || ((hit.power * (!hit.skill?exclusive.attackMultiplier(a,u):1) * a.attack + (!hit.skill?Object.values(u.rends||{}).filter(r=>r.until>t).reduce((sum,r)=>sum+r.value,0):0)) * rules.armorScale) /
          (rules.armorScale + Math.max(policy.localCombat.armorFloor, armor))),
        t,
        hit.skill,
        hit.critical,
        true,
        hit.effect,
        s.trueDamage?"true":magic?"magic":"physical",
        hit.slashIndex,
      );
      if(!hit.skill&&!hit.charmAttack)exclusive.onHit(a,u,t,hits,events,rng);
      if(!hit.charmAttack)skills.onHit(a,u,hit,t,events);
      if(!hit.skill&&u.hp>0)for(const rule of a.equipmentHits||[]){if(rule.stun){if(rng()<(a.range>1?rule.rangedChance:rule.meleeChance)&&!talents.resists(u,rng)){u.stunnedUntil=Math.max(u.stunnedUntil,t+require("./enemy-relief").duration(a,rule.stun));events.push({type:'status',t,target:u.uid,effect:'stun',duration:require("./enemy-relief").duration(a,rule.stun)});}}else{const values={};for(const key of ['armor','magicArmor','attack','cooldownFactor'])if(rule[key])values[key]=rule[key];skills.buff(u,'equipment-'+rule.id,values,t+rule.duration);}}

      if (u.hp > 0) {
        if (s.stun&&!talents.resists(u,rng)){u.stunnedUntil = Math.max(u.stunnedUntil, t + require("./enemy-relief").duration(a,s.stun));events.push({type:'status',t,target:u.uid,effect:'stun',duration:require("./enemy-relief").duration(a,s.stun)});}
        if (s.slow&&!talents.resists(u,rng)) {
          if(!(u.slowUntil>t))events.push({type:'status',t,target:u.uid,effect:'slow',duration:require('./enemy-relief').duration(a,s.duration)});u.slow = s.slow;
          u.slowUntil = t + require("./enemy-relief").duration(a,s.duration);
        }
        if (s.delay) {u.nextSkill += s.delay;for(const id of Object.keys(u.skillTimers||{}))u.skillTimers[id]+=s.delay;}
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
      require('./zhangba-exclusive').afterHit(a,u,hit,t,hits,events,rules);
      if (s.drain) heal(a, a.attack * hit.power, t);
      const counter = skills.managed(u)?skills.passive(u,"counter"):policy.primarySkills[u.heroId];
      if (u.hp > 0 && !charm.active(u,t) && (counter?.passive === "counter"||counter?.kind === "counter") && rng() < counter.chance) {
        events.push({type:"ability",t,uid:u.uid,target:u.uid,effect:"whirl"});
        for (const v of units.filter(
          (v) =>
            v.side !== u.side && v.hp > 0 && distance(v, u) <= counter.radius,
        ))
          damage(u, v, u.attack * counter.power, t, true, false, false,counter.effect);
      }
    }
    const alive = (side) => units.some((u) => u.side === side && u.hp > 0);
    if (!alive("ally") || !alive("enemy")) {
      result = alive("ally") ? "win" : alive("enemy") ? "loss" : "draw";
      break;
    }
    for (const a of units) {
      require('./machao-shield').tick(a,units,t,events,damage,rules);require('./dianwei-exclusive').tick(a,units,t,events);skills.tick(a,units,t,hits,events);exclusive.tick(a,t,events);talents.tick(a,t);if(!charm.active(a,t))equip.tick(a,units,t,events,heal,damage,rng);a.hp=Math.min(a.hp,a.maxHp);
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
      if(protection.protectedUnit(a))continue;
      if (a.nextAction > t || a.stunnedUntil > t || a.channelUntil>t || a.tossedUntil>t) continue;
      const controlled=charm.active(a,t);
      if(charm.activate(a,units,t,hits,events))continue;
      if(!controlled&&qinggang.activate(a,units,t,events)){qinggang.tick(a,units,t,hits,events,rules,rng);continue;}
      const spec = controlled?{}:
          (skills.managed(a)?skills.attackSpec(a,rng):policy.primarySkills[a.heroId]) ||
          (a.legacy
            ? { power: a.skillPower, radius: a.skill === "cleave" ? 1 : 0 }
            : {}),
        targets = units
          .filter((u) => charm.hostile(a,u,t) && protection.targetable(u))
          .sort((a1, b) => distance(a, a1) - distance(a, b) || a1.uid - b.uid);
      let target = targets[0];
      if(!controlled&&a.tauntUntil>t)target=targets.find(u=>u.uid===a.tauntUid)||target;
      if(!target)continue;
      if(!controlled&&skills.activate(a,target,units,t,hits,events,heal,rules,rng)){talents.cast(a,t);continue;}

      const skill = !controlled && (a.legacy
        ? (a.attacks + 1) % a.skillEvery === 0
        : !skills.managed(a) && !spec.passive && !(a.silencedUntil>t) && a.nextSkill <= t);
      if (skill && spec.heal) {
        for (const u of units.filter((u) => u.side === a.side))
          heal(u, a.attack * spec.heal, t);
        a.nextSkill = t + (a.skills?.[0]?.cooldown || rules.moveSeconds)*(a.combatRelief?.cooldown??1);
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
        (!skill || !(spec.farthest || spec.highestHp || spec.line || (spec.openingGlobal&&!a.primaryCasts)))
      ) {
        const next = approachStep(a, target, targets, units, rules, a.tauntUntil>t&&targets.some(u=>u.uid===a.tauntUid));
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
        a.nextAction = t + rules.moveSeconds/(Math.max(.1,1-(a.treeSpeedDown||0))*(1+(a.treeSpeedUp||0))*(1+(a.marchMove||0)));
        continue;
      }
      let s = skill ? spec : spec.passive ? spec : {},
        power = skill ? s.power || 1 : 1;
      if (s.passive === "bonus") power = s.power;
      if (s.passive === "bash") {
        if (skills.managed(a)||rng() < s.chance) power = s.power;
        else s = {};
      }
      if (s.passive === "counter") s = {};
      if(!skill&&a.disarmedUntil>t)continue;
      if(!skill&&exclusive.active(a,'7008')&&a.exclusiveAim?.target!==target.uid)a.exclusiveAim={target:target.uid,stacks:0};
      const critical = rng() < rules.criticalChance + a.critical;
      if (critical) power *= (rules.criticalMultiplier + a.criticalBonus)*equip.critical(a,rng);
      a.exclusiveLastTarget=target.uid;
      a.attacks++;
      if(skill&&a.heroId==='dianwei')require('./dianwei-exclusive').end(a,t,events);
      const toss=skill&&s.skillEffect===require('./dianwei-skill-config').effect?require('./dianwei-toss').launch(a,target,units,t,rules):null;
      const affected = toss?[target]:
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
        ...(toss?{toss}:{}),
        ranged: a.range > 1,
        effect: (skill?spec.skillEffect:null) || spec.effect || (!skills.managed(a)?require("./hero-skill-config").primaryEffects[a.heroId]:null) || null,
      });
      const exclusiveStart=hits.length;
      for (const u of affected)
        hits.push({
          at: t + rules.attackDelay,
          charmAttack:controlled,charmEpoch:a.charmEpoch,
          ...(toss?{toss}:{}),
          a,
          u,
          s,
          power,
          skill,
          critical,
          effect: (skill?spec.skillEffect:null) || spec.effect || (!skills.managed(a)?require("./hero-skill-config").primaryEffects[a.heroId]:null) || null,
        });
      if(skill)exclusive.afterCast(a,units,t,hits,exclusiveStart,events);
      if(!controlled)skills.afterAttack(a,units,t,events,rng,rules);
      a.nextAction = t + a.interval / ((1-Math.max(a.slowUntil>t?a.slow:0,a.auraSlow||0))*(1+(a.skillHaste||0)+(a.equipmentHaste||0)));
      if(skill){a.primaryCasts=(a.primaryCasts||0)+1;talents.cast(a,t);}
      if (skill)
        a.nextSkill =
          t + (a.skills?.[0]?.cooldown || policy.localCombat.interval)*(a.cooldownFactor||1)*(a.combatRelief?.cooldown??1);
    }
  }
  if(result==="draw"){const ally=units.some(u=>u.side==="ally"&&u.hp>0),enemy=units.some(u=>u.side==="enemy"&&u.hp>0);if(!enemy&&ally)result="win";else if(!ally&&enemy)result="loss";}
  if(result==='draw'&&overtime.config(rules).enabled&&units.some(u=>u.side==='ally'&&u.hp>0)&&units.some(u=>u.side==='enemy'&&u.hp>0))throw Error('战斗长期僵持，尚未决出胜负，请调整阵容重试');
  const timedOut=false;
  return {
    timedOut,
    overtimeAt:events.find(e=>e.type==='overtime')?.t,
    initial,
    events,
    result,
    duration: elapsed,
    ...equip.receipt(units,result),
    final: units.map((u) => ({ uid: u.uid, hp: u.hp, x: u.x, y: u.y })),
  };
}
module.exports = { simulate, prepareBattle };
