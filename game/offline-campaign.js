/** 深拷贝存档与战斗数据，避免回放修改持久阵容。 */
function copy(value) { return JSON.parse(JSON.stringify(value)); }

/** 可复现的随机源，同一存档操作序列生成相同商店和战斗。 */
function random(seed) {
  let value = seed >>> 0;
  return function next() {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

class Campaign {
  /** 注入规则、英雄表和存储，使结算可独立于微信与 Cocos 验证。 */
  constructor(rules, roster, storage) {
    this.rules = rules;
    this.roster = roster;
    this.storage = storage;
    this.heroes = new Map(roster.map(hero => [hero.id, hero]));
    if (!roster.length) throw new Error('本地英雄配置为空');
    const saved = storage.read();
    if (saved && !this.valid(saved)) throw new Error('本地存档不兼容或损坏，已保留原存档');
    this.state = saved || this.create();
    this.save();
    for (const method of ['buy', 'refresh', 'deploy', 'sell', 'fight', 'claim']) {
      const operation = this[method];
      /** 存储失败时回滚内存状态，避免重试造成重复扣费或领奖。 */
      this[method] = function transact(...args) {
        const before = copy(this.state);
        try { return operation.apply(this, args); }
        catch (error) { this.state = before; throw error; }
      };
    }
  }

  /** 校验载入数据；损坏存档不能静默重置。 */
  valid(s) {
    return s.version === this.rules.version && Number.isInteger(s.stage) && s.stage > 0 &&
      Number.isInteger(s.gold) && s.gold >= 0 && Number.isInteger(s.nextUid) && s.nextUid > 0 &&
      Number.isInteger(s.battles) && s.battles >= 0 && Number.isInteger(s.wins) && s.wins >= 0 && s.wins <= s.battles &&
      Number.isInteger(s.seed) && Array.isArray(s.units) && s.units.length <= this.rules.benchSize &&
      new Set(s.units.map(unit => unit.uid)).size === s.units.length &&
      s.units.every(unit => this.heroes.has(unit.heroId) && Number.isInteger(unit.uid) && unit.uid > 0 && unit.uid < s.nextUid &&
        Number.isInteger(unit.star) && unit.star > 0 && unit.star <= this.rules.maxStar &&
        Number.isInteger(unit.slot) && unit.slot >= -1 && unit.slot < this.rules.columns * this.rules.rows) &&
      new Set(s.units.filter(u => u.slot >= 0).map(u => u.slot)).size === s.units.filter(u => u.slot >= 0).length &&
      s.units.filter(u => u.slot >= 0).length <= this.rules.deployedLimit &&
      Array.isArray(s.shop) && s.shop.every(id => id === null || this.heroes.has(id)) &&
      (!s.pending || (Number.isInteger(s.pending.gold) && s.pending.gold >= 0 &&
        s.pending.stage === s.stage && ['win', 'loss', 'draw'].includes(s.pending.result)));
  }

  /** 创建仅属于离线远征的存档，初始英雄自动上阵。 */
  create() {
    const s = { version: this.rules.version, stage: 1, gold: this.rules.startingGold,
      nextUid: 1, seed: 1, units: [], shop: [], pending: null, battles: 0, wins: 0 };
    for (let i = 0; i < Math.min(this.rules.startingHeroes, this.rules.deployedLimit); i++) {
      s.units.push({ uid: s.nextUid++, heroId: this.roster[i % this.roster.length].id, star: 1, slot: i });
    }
    this.state = s;
    this.rollShop();
    return s;
  }

  /** 持久化完整事务快照。 */
  save() { this.storage.write(copy(this.state)); }

  /** 商店内容写入存档，重启不会免费刷新。 */
  rollShop() {
    const rng = random(this.state.seed++);
    this.state.shop = Array.from({ length: this.rules.shopSize }, () => this.roster[Math.floor(rng() * this.roster.length)].id);
  }

  /** 等待领取结算时禁止修改阵容和经济。 */
  editable() { if (this.state.pending) throw new Error('请先领取本场结算'); }

  /** 招募英雄并执行三合一，先检查价格与背包容量。 */
  buy(index) {
    this.editable();
    const id = this.state.shop[index], hero = this.heroes.get(id);
    if (!hero) throw new Error('该英雄已售出');
    if (this.state.gold < hero.cost) throw new Error('金币不足');
    if (this.state.units.length >= this.rules.benchSize) throw new Error('阵容已满，请先出售英雄');
    this.state.gold -= hero.cost;
    this.state.units.push({ uid: this.state.nextUid++, heroId: id, star: 1, slot: -1 });
    this.state.shop[index] = null;
    this.merge();
    this.save();
  }

  /** 相同星级三合一，优先保留已上阵英雄的格子。 */
  merge() {
    for (let star = 1; star < this.rules.maxStar; star++) {
      for (const hero of this.roster) {
        let group = this.state.units.filter(u => u.heroId === hero.id && u.star === star);
        while (group.length >= this.rules.mergeCount) {
          group.sort((a, b) => (b.slot >= 0) - (a.slot >= 0));
          const merged = group.slice(0, this.rules.mergeCount), keep = merged[0];
          keep.star++;
          this.state.units = this.state.units.filter(u => u === keep || !merged.includes(u));
          group = this.state.units.filter(u => u.heroId === hero.id && u.star === star);
        }
      }
    }
  }

  /** 刷新商店只扣配置指定的金币。 */
  refresh() {
    this.editable();
    if (this.state.gold < this.rules.refreshCost) throw new Error('金币不足');
    this.state.gold -= this.rules.refreshCost;
    this.rollShop();
    this.save();
  }

  /** 布阵支持空位移动和交换；不会重复占用格子。 */
  deploy(uid, slot) {
    this.editable();
    const unit = this.state.units.find(u => u.uid === uid);
    if (!unit || !Number.isInteger(slot) || slot < -1 || slot >= this.rules.columns * this.rules.rows) throw new Error('无效布阵位置');
    const occupant = this.state.units.find(u => u.slot === slot && slot >= 0 && u !== unit);
    if (slot >= 0 && unit.slot < 0 && !occupant && this.state.units.filter(u => u.slot >= 0).length >= this.rules.deployedLimit) throw new Error('达到上阵人数上限');
    if (occupant) occupant.slot = unit.slot;
    unit.slot = slot;
    this.save();
  }

  /** 出售返还基础花费，避免买卖生成无限金币。 */
  sell(uid) {
    this.editable();
    const unit = this.state.units.find(u => u.uid === uid);
    if (!unit) throw new Error('请先选择英雄');
    if (this.state.units.length <= 1) throw new Error('至少保留一名英雄');
    this.state.gold += this.heroes.get(unit.heroId).cost * Math.pow(this.rules.mergeCount, unit.star - 1);
    this.state.units = this.state.units.filter(u => u.uid !== uid);
    this.save();
  }

  /** 基于章节和固定种子生成本地敌方阵容。 */
  enemies() {
    const rng = random(this.state.stage * 997);
    const count = Math.min(this.rules.deployedLimit, this.rules.enemyStartCount + Math.floor((this.state.stage - 1) / this.rules.enemyCountEvery));
    return Array.from({ length: count }, (_, index) => ({ uid: -index - 1,
      heroId: this.roster[Math.floor(rng() * this.roster.length)].id, star: 1, slot: index }));
  }

  /** 将英雄表转换为战斗单位，同种族或职业两人提供本地羁绊增益。 */
  combatants(units, side) {
    return units.map(unit => {
      const hero = this.heroes.get(unit.heroId);
      const matching = units.filter(u => { const other = this.heroes.get(u.heroId); return other.race === hero.race || other.profession === hero.profession; }).length;
      const synergy = matching >= this.rules.synergyCount ? 1 + this.rules.synergyBonus : 1;
      const scale = Math.pow(this.rules.starMultiplier, unit.star - 1) * (side === 'enemy' ? this.rules.enemyBaseScale + (this.state.stage - 1) * this.rules.enemyGrowth : synergy);
      const hp = Math.max(1, Math.round(hero.hp * scale));
      return { ...unit, side, name: hero.name, hp, maxHp: hp, attack: hero.attack * scale, armor: hero.armor, synergy: side === 'ally' && synergy > 1 };
    });
  }

  /** 本地自动战斗生成可回放事件；结果先落盘，退出重进不会重复发奖。 */
  fight() {
    this.editable();
    const deployed = this.state.units.filter(u => u.slot >= 0);
    if (!deployed.length) throw new Error('请至少上阵一名英雄');
    const units = [...this.combatants(deployed, 'ally'), ...this.combatants(this.enemies(), 'enemy')];
    const initial = copy(units), frames = [], rng = random(this.state.seed++);
    // 交替安排双方行动，避免所有友军先手造成系统性偏差。
    const order = [];
    const allies = units.filter(u => u.side === 'ally'), enemies = units.filter(u => u.side === 'enemy');
    for (let i = 0; i < Math.max(allies.length, enemies.length); i++) {
      if (allies[i]) order.push(allies[i]);
      if (enemies[i]) order.push(enemies[i]);
    }
    for (let turn = 0; turn < this.rules.maxTurns; turn++) {
      if (!allies.some(u => u.hp > 0) || !enemies.some(u => u.hp > 0)) break;
      const actor = order[turn % order.length];
      if (actor.hp <= 0) continue;
      const targets = units.filter(u => u.side !== actor.side && u.hp > 0);
      targets.sort((a, b) => Math.abs(a.slot % this.rules.columns - actor.slot % this.rules.columns) - Math.abs(b.slot % this.rules.columns - actor.slot % this.rules.columns) || a.slot - b.slot);
      const target = targets[0], critical = rng() < this.rules.criticalChance;
      const damage = Math.max(this.rules.minimumDamage, Math.round(actor.attack * this.rules.armorScale / (this.rules.armorScale + Math.max(0, target.armor)) * (critical ? this.rules.criticalMultiplier : 1)));
      target.hp = Math.max(0, target.hp - damage);
      frames.push({ actor: actor.uid, target: target.uid, damage, hp: target.hp, critical });
    }
    const result = enemies.every(u => u.hp <= 0) ? 'win' : allies.every(u => u.hp <= 0) ? 'loss' : 'draw';
    const gold = result === 'win' ? this.rules.winGold + (this.state.stage % this.rules.chapterBonusEvery === 0 ? this.rules.chapterBonusGold : 0) : this.rules.lossGold;
    this.state.pending = { stage: this.state.stage, result, gold };
    this.save();
    return { initial, frames, result };
  }

  /** 领取结算为幂等操作，胜利前进一关，失败保留阵容允许重试。 */
  claim() {
    const pending = this.state.pending;
    if (!pending) return false;
    this.state.gold += pending.gold;
    this.state.battles++;
    if (pending.result === 'win') { this.state.stage++; this.state.wins++; }
    this.state.pending = null;
    this.rollShop();
    this.save();
    return true;
  }
}

module.exports = { Campaign, random };
