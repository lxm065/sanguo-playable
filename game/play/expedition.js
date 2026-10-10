"use strict";
const { Campaign } = require("./campaign"),
  { random } = require("./combat"),
  policy = require("./expedition-config");
/** 远征领域服务：分类奖励、合成目标及装备均经同一个存档事务提交。 */
class Expedition extends Campaign {
  /** 嵌套领域操作只由最外层事务校验和写盘，杜绝半次发奖。 */
  transact(operation) {
    if (this.transactionDepth) return operation();
    this.transactionDepth = 1;
    try {
      const acquisition=require('./hero-acquisition'),before=acquisition.known(this),run=this.state.expedition,discovery=require('./equipment-discovery'),seen=discovery.known(this.state);
      return super.transact(()=>{const rank=require('./friend-rank-metric');rank.record(this.state);const result=operation();acquisition.record(this,before,run);discovery.record(this,seen);rank.record(this.state);return result;});
    } finally {
      this.transactionDepth = 0;
    }
  }
  /** 兼容旧存档，仅补充缺失的装备与福利字段。 */
  constructor(rules, roster, storage) {
    let migrated=false;
    super(rules, roster, {read:()=>{const saved=require('./challenge-storage').snapshot(storage.read()),next=require('./population').migrate(saved,rules);migrated=next!==saved;return next;},write:s=>storage.write(require("./challenge-storage").snapshot(s))});
    if(migrated)this.transact(()=>{});
    this.nodeEvents=new (require("./node-events").NodeEvents)(this);
    if (!this.state.expedition)
      this.transact(() => {
        this.state.expedition = {
          equipment: [],
          nextEquipment: 1,
          novice: policy.noviceStart,
          adSerial: 0,
        };
      });
    if (!this.state.expedition.level)
      this.transact(() => {
        this.state.expedition.level =
          1 + Math.floor(this.state.wins / rules.limitEveryWins);
        this.state.expedition.experience = 0;
      });
  }
  /** 新远征初始化保留旧协议字段，新增状态由构造器统一填充。 */
  create() {
    const s = super.create();
    s.units.forEach((unit, index) => {
      unit.slot =
        index < this.validationLimit({ ...s, meta: this.state?.meta })
          ? (policy.initialSlots[index] ?? -1)
          : -1;
    });
    s.expedition = {
      tutorialRunId: (this.state?.expedition?.tutorialRunId || 0) + 1,
      equipment: [],
      nextEquipment: 1,
      novice: policy.noviceStart,
      adSerial: this.state?.expedition ? this.state.expedition.adSerial + 1 : 0,
      level: 1,
      populationVersion: policy.population.version,
      experience: 0,
    };
    return s;
  }
  /** 等级只影响人数，不将上阵校验绑定到胜场数。 */
  validationLimit(s) {
    return require('./population').limit(s,this.rules);
  }
  /** 面板与领域校验使用同一个人数上限。 */
  limit() {
    return this.validationLimit(this.state);
  }
  /** 第一章首节点仍教学原地合成，之后开放视频定向。 */
  canDirect() {
    const m = this.state.meta;
    return (
      !policy.directedAfterFirstNode ||
      (!!m && (m.chapter > 1 || m.section > 1 || m.layer > 0))
    );
  }
  /** 验证装备归属、上限和选择奖励，兼容历史待领取战报。 */
  valid(s) {
    if (!require('./challenge').valid(s.meta?.challenge,this.roster,this.rules)) return false;
    if (!require("./talent-tree").valid(s.meta?.activities?.talent?.tree)||!super.valid(s)||!require("./equipment-upgrades").valid(s.meta?.equipmentGrades)) return false;
    if(s.pending?.rewardRanks&&(!Array.isArray(s.pending.rewardRanks)||s.pending.rewardRanks.length!==s.pending.choices.length||s.pending.rewardRanks.some(n=>!Number.isInteger(n)||n<1||n>policy.maxStar)))return false;
    const e = s.expedition;
    if (!e) return true;
    const p = s.pending;
    if (
      p?.rewardKind &&
      (!["heroes", "equipment", "none"].includes(p.rewardKind) ||
        !Number.isInteger(p.rewardStar) ||
        p.rewardStar < 1 ||
        p.rewardStar > this.rules.maxStar ||
        (p.rewardKind === "equipment" &&
          !policy.equipment.some((x) => x.id === p.equipmentId)))
    )
      return false;
    return (
      (e.level === undefined ||
        (Number.isInteger(e.level) &&
          e.level >= 1 &&
          Number.isInteger(e.experience) &&
          e.experience >= 0)) &&
      Number.isInteger(e.adSerial) &&
      e.adSerial >= 0 &&
      Array.isArray(e.equipment) &&
      Number.isInteger(e.nextEquipment) &&
      e.nextEquipment > 0 &&
      Number.isInteger(e.novice) &&
      e.novice >= 0 &&
      e.novice <= policy.novice.length &&
      new Set(e.equipment.map((x) => x.uid)).size === e.equipment.length &&
      e.equipment.every(
        (x) =>
          (x.stacks===undefined||(Number.isInteger(x.stacks)&&x.stacks>=0&&x.stacks<=(require('./equipment-effect-config')[x.id]?.maxStacks||0))) && Number.isInteger(x.uid) &&
          x.uid > 0 &&
          x.uid < e.nextEquipment &&
          policy.equipment.some((v) => v.id === x.id) &&
          (x.owner === null || s.units.some((u) => u.uid === x.owner)),
      ) &&
      s.units.every(
        (u) =>
          e.equipment.filter((x) => x.owner === u.uid).length <=
          policy.equipmentLimit,
      )
    );
  }
  /** 获取池从图鉴章节条件派生，兼容角色不参与掉落。 */
  availableRoster() {
    const m = this.state.meta;
    return this.roster.filter(
      (h) =>
        !h.legacy && require("./section-policy").eligible(h.id,m) &&
        (h.unlock === "initial" ||
          (h.unlock === "boss" && m?.unlocked.includes(h.id)) ||
          (h.unlock === "chapter" && (m?.cleared || 0) >= h.chapter)),
    );
  }
  /** 当前可升阶上限采用章节条件而非图鉴展示等级。 */
  maxRank() {
    return (this.state.meta?.cleared || 0) >= policy.fiveStarChapter
      ? this.rules.maxStar
      : policy.rankLimit;
  }
  /** 按目标阶筛选可获取武将，避免生成低于最低阶的棋子。 */
  pool(star) {
    return this.availableRoster().filter(
      (h) => h.tier <= star && h.tiers.some((t) => t.star === star),
    );
  }
  /** 指定数量有放回抽取，保留原版重复候选。 */
  picks(star) {
    const pool = this.pool(star),
      rng = random(this.state.seed++);
    if (!pool.length) throw Error("该阶没有可获取武将");
    return Array.from(
      { length: policy.choiceCount },
      () => require("./talent-economy").pick(this,pool,rng).id,
    );
  }
  /** 招募列表只出售一阶单位；高阶由合成与关卡福利获得。 */
  roll() {
    this.state.shop = this.picks(1);
  }
  /** 预览定向候选只读取状态，不改变随机种子或玩家存档。 */
  directedTargets(uid) {
    const u = this.unit(uid),
      pool = this.pool(u.star + 1),
      rng = random(this.state.seed + uid);
    return [...pool]
      .sort((a, b) => a.id.localeCompare(b.id))
      .map((h) => ({ h, k: rng() }))
      .sort((a, b) => a.k - b.k)
      .slice(0, policy.choiceCount)
      .map((x) => x.h.id);
  }
  /** 三合一保留所选棋子；被消耗武将的装备先移回装备栏。 */
  merge(uid, mode = "same", target = null, ticket = null) {
    return this.transact(() => {
      this.editable();
      const unit = this.unit(uid);
      if (unit.star >= this.maxRank()) throw Error("当前章节已达最高阶");
      if (!["same", "random", "directed"].includes(mode))
        throw Error("无效合成方式");
      const group = this.state.units
        .filter((u) => u.heroId === unit.heroId && u.star === unit.star)
        .sort((a, b) => (b.uid === uid) - (a.uid === uid))
        .slice(0, this.rules.mergeCount);
      if (group.length < this.rules.mergeCount)
        throw Error("需要三名相同、同阶武将");
      if (mode === "directed") {
        if (!this.canDirect()) throw Error("通过首个节点后开放定向合成");
        if (!this.directedTargets(uid).includes(target))
          throw Error("定向目标已失效");
        this.consumeAd(ticket);
      }
      const pool = this.pool(unit.star + 1);
      if (mode === "random") {
        const rng = random(this.state.seed++);
        target = require("./talent-economy").pick(this,pool,rng).id;
      }
      if (unit.slot < 0) unit.slot = group.find((u) => u.slot >= 0)?.slot ?? -1;
      for (const item of this.state.expedition.equipment)
        if (group.some((u) => u.uid === item.owner && u.uid !== uid))
          item.owner = null;
      unit.star++;
      if(unit.star===4)this.activities?.record("merge4");
      if (mode !== "same") unit.heroId = target;
      this.state.units = this.state.units.filter(
        (u) => u === unit || !group.includes(u),
      );
      if(this.state.expedition.talentReserve?.length)require("./talent-economy").deliver(this);
      return uid;
    });
  }
  /** 创建广告流程快照；未完成或旧页面回调不能领取。 */
  adTicket() {
    return {
      serial: this.state.expedition.adSerial,
      pending: this.state.pending?.id || null,
      novice: this.state.expedition.novice,
    };
  }
  /** 成功回调消费一次凭据，调用者必须已确认平台完整观看。 */
  consumeAd(ticket) {
    const e = this.state.expedition;
    if (
      !ticket ||
      ticket.serial !== e.adSerial ||
      ticket.pending !== (this.state.pending?.id || null) ||
      ticket.novice !== e.novice
    )
      throw Error("广告奖励已领取或页面已变化");
    e.adSerial++;
  }
  /** 普通敌阵仅取当前开放武将，BOSS仍使用章节策略的固定配置。 */
  enemies() {
    const cached=require("./enemy-budget").cached(this.state);if(cached)return require('./enemy-stage').apply(cached,this.state,this.rules,this.roster,true);
    const configured = this.hooks?.enemies?.();
    const type=this.progression?.nodes().find(n=>n.id===this.state.meta?.activeNode)?.type||'battle';
    const difficulty=require('./chapter-difficulty');
    const prepare=units=>require('./enemy-stage').apply(require('./tutorial-enemy').apply(require('./enemy-budget').decorate(require('./enemy-equipment').equip(require('./enemy-formation').arrange(units.map(u=>({...u,star:Math.max(u.star,difficulty.minimum(this.state))})),this.roster,this.rules),difficulty.equipmentState(this.state),this.roster,type),this.state,this.rules,this.roster),this.state),this.state,this.rules,this.roster);
    if (configured) return prepare(type==='boss'?difficulty.reinforce(this.state,this.rules,configured):configured);
    const r = this.rules,
      rng = random(this.state.stage * 997),
      rank = Math.min(
        this.maxRank(),
        1 + Math.floor((this.state.stage - 1) / policy.enemyRankEveryStages),
      ),
      chapterPool = require('./journey-config').enemyPools[this.state.meta?.chapter],
      pool = difficulty.pool(this.state,this.roster,rank) || (chapterPool ? this.roster.filter(h=>chapterPool.includes(h.id)&&h.tier<=rank) : this.availableRoster().filter((h) => h.tier <= rank)),
      count = Math.min(
        r.enemyMaxDeployedLimit || r.maxDeployedLimit,
        r.enemyStartCount +
          Math.floor((this.state.stage - 1) / r.enemyEveryStages),
      );
    return prepare(Array.from({ length: difficulty.count(this.state,r,count) }, (_, i) => {
      const h = pool[Math.floor(rng() * pool.length)];
      return {
        uid: -i - 1,
        heroId: h.id,
        star: difficulty.star(this.state,h),
        slot: r.enemyColumns[i % r.enemyColumns.length],
      };
    }));
  }
  /** 普通战果生成兵种候选；精英战果只生成装备，不自动放入背包。 */
  fight(training = false) {
    return this.transact(() => {
      if(!training&&this.state.meta?.sectionReward)throw Error('请先领取通关奖励');
      require("./talent-economy").beforeFight(this,training);
      const battle = super.fight(training),
        p = this.state.pending,
        node = this.progression
          ?.nodes()
          .find((n) => n.id === this.state.meta.activeNode);
      p.gold=require("./battle-gold").reward(this.state,node,p)+(battle.equipmentGold||0);
      p.rewardKind =
        !training && battle.result === "win"
          ? node?.type === "elite"
            ? "equipment"
            : "heroes"
          : "none";
      if(require('./chapter-final-reward').skip(this,p))p.rewardKind='none';
      p.rewardStar = 1;
      p.refreshes = 0;
      p.experience =
        !training && battle.result === "win"
          ? require("./level-progression").reward(this.state.meta?.chapter,node?.type)
          : 0;
      if (p.rewardKind === "equipment") {
        p.choices = [];
        const rng = random(this.state.seed++);
        p.equipmentId =
          require('./elite-loot').pick(this.state.meta.chapter,rng);
      } else if (p.rewardKind === "heroes")
        p.choices = this.picks(p.rewardStar);
      else p.choices = [];
      if(!training&&battle.result==="win")p.experience+=require("./vip").perks(this).data_6;
      require("./talent-economy").settlePreview(this,p,node);
      return battle;
    });
  }
  /** 完整观看刷新为二阶三选一，结果先保存再显示。 */
  refreshReward(ticket=null,expected=null) {
    return this.transact(() => {
      const p = this.state.pending;
      if (!p || p.rewardKind !== "heroes") throw Error("当前没有兵种奖励");
      if(expected&&(p.id!==expected.id||(p.coinRefreshes||0)!==expected.coins||p.refreshes!==expected.ads))throw Error('刷新结果已变化');
      const c=require('./reward-refresh-config'),bag=this.state.meta.inventory;
      if((bag[c.item]||0)>=c.cost){bag[c.item]-=c.cost;p.coinRefreshes=(p.coinRefreshes||0)+1;this.state.expedition.adSerial++;}
      else {if(p.refreshes>=require('./vip').perks(this).data_1)throw Error('本场视频换一批次数已用完');this.consumeAd(ticket);p.refreshes++;}
      require('./reward-rank').roll(this);
    });
  }
  /** 发放唯一装备实例，尚未穿戴时放入本局装备栏。 */
  addEquipment(id) {
    const e = this.state.expedition;
    if (!policy.equipment.some((x) => x.id === id)) throw Error("未知装备");
    const item = { uid: e.nextEquipment++, id, owner: null };
    e.equipment.push(item);
    require("./equipment-tutorial").acquired(this,item);
    this.activities?.record("equipment");
    return item.uid;
  }
  /** 同一事务完成选将、装备与推进，任何错误均保留待领取战果。 */
  claim(index = null, discard = false) {
    if (!this.state.pending) return false;
    return this.transact(() => {
      const p = this.state.pending;
      if(require('./chapter-final-reward').skip(this,p)){p.rewardKind='none';p.choices=[];index=null;}
      if (p.rewardKind === "heroes" && index === null && !discard)
        throw Error("请选择一名武将");
      if (index !== null) {
        if (!Number.isInteger(index) || !p.choices[index])
          throw Error("无效奖励");
        if (require('./reserve-policy').full(this.rules,this.state.units.length))
          throw Error("备战席已满，请先腾出位置");
        this.state.units.push({
          uid: this.state.nextUid++,
          heroId: p.choices[index],
          star: p.rewardRanks?.[index] || p.rewardStar || 1,
          slot: -1,
        });
      }
      if (p.rewardKind === "equipment") this.addEquipment(p.equipmentId);
      if(p.talentLoot?.length||this.state.expedition.talentReserve?.length)require("./talent-economy").deliver(this,p.talentLoot);
      this.hooks?.settle?.(p);
      this.state.gold += p.gold;
      const e = this.state.expedition;
      e.experience += p.experience || 0;
      require('./level-progression').advance(e);
      this.state.battles++;
      if (!p.training && p.battle.result === "win") {
        this.state.stage++;
        this.state.wins++;
        this.activities?.record("wins");
      }
      for(const change of p.battle.equipmentProgress||[]){const item=e.equipment.find(v=>v.uid===change.uid);if(item)item.stacks=change.stacks;}
      this.state.pending = null;
      this.state.expedition.vipSpeedActive=false;
      if (!p.training) this.roll();
      return true;
    });
  }
  /** 福利按三星关羽、龙心、钻石顺序领取，容量不足不消耗凭据。 */
  claimNovice(ticket) {
    return this.transact(() => {
      this.editable();
      const e = this.state.expedition,
        {index,offer} = require('./novice-rewards').current(this);
      if (!offer) throw Error("福利已全部领取");
      if (
        offer.kind === "hero" &&
        require('./reserve-policy').full(this.rules,this.state.units.length)
      )
        throw Error("备战席已满");
      this.consumeAd(ticket);
      if (offer.kind === "hero")
        this.state.units.push({
          uid: this.state.nextUid++,
          heroId: offer.id,
          star: offer.star,
          slot: -1,
        });
      else if (offer.kind === "equipment") this.addEquipment(offer.id);
      else this.progression.add('1',offer.count);
      require('./novice-rewards').mark(this,index);e.novice=index+1;
    });
  }
  /** 装备转移及卸下不复制物品，第四件必须先卸下已有装备。 */
  equip(itemUid, owner) {
    return this.transact(() => {
      this.editable();
      const item = this.state.expedition.equipment.find(
        (x) => x.uid === itemUid,
      );
      if (!item) throw Error("装备不存在");
      if (owner !== null) {
        this.unit(owner);
        if (
          this.state.expedition.equipment.filter(
            (x) => x.owner === owner && x !== item,
          ).length >= policy.equipmentLimit
        )
          throw Error("每名武将最多装备3件");
      }
      item.owner = owner;
      require("./equipment-tutorial").equipped(this,owner);
    });
  }
  /** 遣返将装备归还背包，保留父类经济与最后一人限制。 */
  sell(uid) {
    return this.transact(() => {
      for (const item of this.state.expedition.equipment)
        if (item.owner === uid) item.owner = null;
      const result=super.sell(uid);if(this.state.expedition.talentReserve?.length)require("./talent-economy").deliver(this);return result;
    });
  }
}
module.exports = { Expedition };
