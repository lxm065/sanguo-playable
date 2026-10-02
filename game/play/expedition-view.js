"use strict";
const { ClassicView } = require("./classic-view"),
  { PlayView } = require("./view"),
  policy = require("./expedition-config"),
  { stats, bonds } = require("./expedition-stats"),
  classic = require("./classic-config");
/** 远征视图负责交互展示，奖励和装备事务交给领域服务。 */
class ExpeditionView extends ClassicView {
  /** 保留战场领取后的阵容，通过前进按钮返回路线。 */
  act(operation) {
    try {
      if (this.playing) throw Error("交战中，请等待结算");
      operation();
    } catch (e) {
      this.render();
      this.notice("提示", e.message);
      return;
    }
    this.render();
  }
  /** 棋盘、主公资源、新人福利以及羁绊装备栏共用战斗状态。 */
  renderBattle() {
    PlayView.prototype.renderBattle.call(this);
    const u = this.ui,
      s = this.model.state,
      m = s.meta;
    for (const n of [...this.root.children])
      if (
        [
          "battle-header",
          "详情 / 合成",
          "选中下阵",
          "军营招募",
          "开始战斗",
          "阵容说明",
        ].includes(n.name)
      )
        n.destroy();
    u.box(this.root, "expedition-header", 0, 550, 720, 180, "#241F19");
    u.portrait(
      this.root,
      this.progress.lord().portrait,
      -290,
      554,
      110,
      130,
      classic.portraitCrop,
    );
    u.text(this.root, "♥".repeat(m.hp), -140, 607, 32, "#E65441", 170);
    u.text(
      this.root,
      s.units.filter((x) => x.slot >= 0).length + "/" + this.model.limit(),
      42,
      607,
      26,
      "#F0D36B",
      130,
    );
    u.text(this.root, "金币 " + s.gold, 202, 607, 26, "#F0D36B", 185);
    u.text(
      this.root,
      "等级 " + s.expedition.level,
      -288,
      480,
      24,
      "#EEE6D6",
      140,
    );
    u.text(
      this.root,
      this.progress.lord().skillName,
      -144,
      531,
      24,
      "#EFD784",
      135,
    );
    u.button(
      this.root,
      "地图",
      270,
      531,
      128,
      () => {
        if (!this.playing) {
          this.page = "map";
          this.render();
        }
      },
      "#72572C",
      48,
    );
    const offer = policy.novice[s.expedition.novice];
    if (offer && !s.pending) {
      const name =
        offer.kind === "hero"
          ? "3阶 关羽"
          : offer.kind === "equipment"
            ? "龙心"
            : "10000钻石";
      const n = u.box(
        this.root,
        "novice-benefit",
        290,
        375,
        130,
        145,
        "#433425",
      );
      if (offer.kind === "hero")
        u.image(n, offer.id + "-avatar.png", 0, 20, 82, 82);
      else if (offer.kind === "equipment")
        u.image(n, "equipment/" + offer.id + ".png", 0, 20, 82, 82);
      else u.text(n, "◆", 0, 22, 48, "#F3C448", 110);
      u.text(n, name, 0, -34, 22, "#F3D778", 130);
      u.button(
        n,
        "▶ 新人福利",
        0,
        -78,
        150,
        () => this.ad(() => this.model.claimNovice(ticket)),
        "#8A581C",
        48,
      );
      const ticket = this.model.adTicket();
    }
    u.box(this.root, "expedition-footer", 0, -521, 720, 222, "#2B251F");
    const active = bonds(
      s.units.filter((x) => x.slot >= 0),
      this.roster,
    );
    u.text(this.root, "羁绊", -309, -446, 26, "#7AB755", 98);
    active
      .filter((b) => b.count)
      .forEach((b, i) =>
        u.button(
          this.root,
          b.value + " " + b.count,
          -209 + i * 73,
          -446,
          70,
          () =>
            this.notice(
              b.name,
              b.effect
                .replace("{0}", b.values[0])
                .replace("{1}", b.values[1])
                .replace("{2}", b.values[2] || "") +
                "\n不同武将：" +
                b.count +
                "，当前档位：" +
                b.level,
            ),
          b.level ? "#53623B" : "#45413A",
          43,
        ),
      );
    u.text(this.root, "装备", -309, -532, 26, "#7AB755", 98);
    u.button(
      this.root,
      "装备栏 (" +
        s.expedition.equipment.filter((x) => x.owner === null).length +
        ")",
      -138,
      -532,
      224,
      () => this.equipmentPanel(),
      "#675134",
      64,
    );
    u.button(
      this.root,
      m.activeNode ? "开始" : "前进",
      229,
      -533,
      230,
      () =>
        m.activeNode
          ? this.act(() => this.start(false))
          : ((this.page = "map"), this.render()),
      "#973B22",
      72,
    );
    u.button(
      this.root,
      "×" + this.speed,
      153,
      -605,
      91,
      () => {
        const list = this.config.speedOptions;
        this.speed = list[(list.indexOf(this.speed) + 1) % list.length];
        this.render();
      },
      "#524B3C",
      43,
    );
    u.button(
      this.root,
      "武将详情",
      -138,
      -604,
      224,
      () =>
        this.selected
          ? this.details(this.model.unit(this.selected).heroId, this.selected)
          : this.notice("提示", "点击武将查看详情；拖动武将进行布阵。"),
      "#524B3C",
      43,
    );
    if (this.modal) this.modal.setSiblingIndex(this.root.children.length - 1);
  }
  /** 轻触打开详情或可用合成，拖动继续复用已验证的交换布阵。 */
  drawFriendly(unit, x, y, scale) {
    const actor = super.drawFriendly(unit, x, y, scale);
    let start;
    actor.node.on(this.cc.Node.EventType.TOUCH_START, (e) => {
      start = e.getUILocation();
    });
    actor.node.on(this.cc.Node.EventType.TOUCH_END, (e) => {
      const p = e.getUILocation();
      if (
        start &&
        Math.hypot(p.x - start.x, p.y - start.y) <
          this.config.layout.dragThreshold &&
        !this.playing &&
        !this.model.state.pending
      ) {
        const count = this.model.state.units.filter(
          (v) => v.heroId === unit.heroId && v.star === unit.star,
        ).length;
        if (count >= this.config.mergeCount && unit.star < this.model.maxRank())
          this.mergePanel(unit.uid);
        else this.details(unit.heroId, unit.uid);
      }
    });
    return actor;
  }
  /** 绘制属性与原始技能说明；长内容采用分页，避免缩字与裁切。 */
  heroCard(
    parent,
    id,
    star,
    x,
    y,
    width,
    height,
    unknown = false,
    page = 0,
    effective = null,
  ) {
    const u = this.ui,
      c = this.paper(parent, "hero-card", x, y, width, height),
      hero = this.roster.find((h) => h.id === id),
      tier = effective || hero?.tiers?.find((t) => t.star === star) || hero;
    u.text(
      c,
      star + "  " + (unknown ? "随机" : hero.name),
      0,
      height / 2 - 61,
      31,
      policy.colors[star - 1],
      width - 24,
    );
    if (unknown)
      u.text(c, "？", 0, height / 2 - 180, 90, "#92836B", width - 30, 120);
    else
      u.image(
        c,
        id + "-avatar.png",
        0,
        height / 2 - 184,
        policy.layout.portrait,
        policy.layout.portrait,
      );
    u.text(
      c,
      unknown
        ? "???  ???  ???"
        : hero.faction + "  " + hero.role + "  射程 " + tier.range,
      0,
      height / 2 - 283,
      23,
      "#59422C",
      width - 26,
      65,
    );
    u.text(
      c,
      unknown
        ? "♥ ???    ⚔ ???\n物防 ???   魔防 ???"
        : "生命 " +
            tier.hp +
            "   攻击 " +
            tier.attack +
            "\n物防 " +
            tier.armor +
            "   魔防 " +
            (tier.magicArmor || 0),
      0,
      height / 2 - 361,
      22,
      "#59422C",
      width - 28,
      96,
    );
    u.text(c, "技能", 0, height / 2 - 432, 27, "#694A2C", width - 24);
    const skills = tier?.skills || [
        { name: hero?.skillName, description: hero?.description, cooldown: 0 },
      ],
      perPage = 2;
    skills.slice(page * perPage, (page + 1) * perPage).forEach((s, i) => {
      const yy = height / 2 - 501 - i * 180;
      u.text(
        c,
        unknown
          ? "???"
          : s.name + (s.cooldown ? " · " + s.cooldown + "秒" : " · 被动"),
        0,
        yy,
        24,
        "#38651E",
        width - 36,
        60,
      );
      u.text(
        c,
        unknown ? "未知技能" : s.description,
        0,
        yy - 83,
        policy.layout.skillFont,
        "#58422D",
        width - 42,
        140,
      );
    });
    if (skills.length > perPage)
      u.button(
        c,
        "技能 " + (page + 1) + "/" + Math.ceil(skills.length / perPage) + "  ›",
        0,
        -height / 2 + 42,
        width - 65,
        () => {
          c.destroy();
          this.heroCard(
            parent,
            id,
            star,
            x,
            y,
            width,
            height,
            unknown,
            (page + 1) % Math.ceil(skills.length / perPage),
            effective,
          );
        },
        "#967449",
        45,
      );
    return c;
  }
  /** 双栏升阶预览：左边下一阶同名，右边下一阶未知角色。 */
  mergePanel(uid) {
    const unit = this.model.unit(uid),
      m = this.overlay(),
      l = policy.layout;
    this.heroCard(
      m,
      unit.heroId,
      unit.star + 1,
      -174,
      l.cardY,
      l.cardWidth,
      l.cardHeight,
    );
    this.heroCard(
      m,
      unit.heroId,
      unit.star + 1,
      174,
      l.cardY,
      l.cardWidth,
      l.cardHeight,
      true,
    );
    this.ui.button(m, "原地升级", -230, -510, 212, () =>
      this.act(() => this.model.merge(uid, "same")),
    );
    if (this.model.canDirect())
      this.ui.button(
        m,
        "▶ 定向升级",
        0,
        -510,
        228,
        () => this.directedPanel(uid),
        "#B98216",
        88,
      );
    else
      this.ui.text(
        m,
        "通过首关\n开放定向升级",
        0,
        -510,
        23,
        "#D7C39D",
        220,
        90,
      );
    this.ui.button(m, "随机升级", 230, -510, 212, () =>
      this.act(() => this.model.merge(uid, "random")),
    );
    this.ui.button(m, "返回", 0, -601, 220, () => this.render(), "#655744", 46);
  }
  /** 定向广告成功后选目标；凭据在实际合成事务中一次消费。 */
  directedPanel(uid) {
    const ticket = this.model.adTicket();
    this.ad(() => {
      setTimeout(() => {
        const m = this.overlay(),
          unit = this.model.unit(uid);
        this.paper(m, "directed-selection", 0, 0, 680, 700);
        this.ui.text(m, "选择定向升级目标", 0, 281, 33, "#694A2C");
        this.model.directedTargets(uid).forEach((id, i) => {
          const x = (i - 1) * 215,
            h = this.roster.find((v) => v.id === id);
          this.ui.image(m, id + "-avatar.png", x, 93, 146, 146);
          this.ui.text(m, h.name, x, -17, 29, "#694A2C", 205);
          this.ui.button(m, "选择", x, -135, 190, () =>
            this.act(() => this.model.merge(uid, "directed", id, ticket)),
          );
        });
        this.ui.button(m, "取消", 0, -282, 240, () => this.render(), "#655744");
      }, 0);
    });
  }
  /** 武将详情左侧固定三个装备槽，卸下与穿戴均调用领域事务。 */
  details(id, uid = null) {
    const unit = uid ? this.model.unit(uid) : null,
      hero = this.roster.find((h) => h.id === id),
      m = this.overlay(),
      l = policy.layout;
    m.on(this.cc.Node.EventType.TOUCH_END, (e) => {
      if (e.target === m) this.render();
    });
    const value = unit
      ? stats(
          unit,
          unit.slot >= 0
            ? this.model.state.units.filter((v) => v.slot >= 0)
            : [unit],
          this.roster,
          this.model.state.expedition.equipment,
          this.config,
        )
      : null;
    const card = this.heroCard(
      m,
      id,
      unit?.star || hero.tier || 1,
      54,
      33,
      l.detailWidth,
      l.detailHeight,
      false,
      0,
      value,
    );
    if (unit) {
      const items = this.model.state.expedition.equipment.filter(
        (e) => e.owner === uid,
      );
      this.ui.text(m, "装备栏", -235, 557, 26, "#EEE6D6", 140);
      for (let i = 0; i < policy.equipmentLimit; i++) {
        const item = items[i],
          e = policy.equipment.find((v) => v.id === item?.id);
        const slot = this.ui.button(
          m,
          e ? "" : "＋",
          -235,
          475 - i * 110,
          100,
          () =>
            e ? this.equipmentDetails(item, uid) : this.equipmentPanel(uid),
          "#53412D",
          94,
        );
        if (e) this.ui.image(slot, "equipment/" + e.id + ".png", 0, 0, 82, 82);
      }
      this.ui.text(
        card,
        "本地演算：主技能生效",
        0,
        -l.detailHeight / 2 + 94,
        20,
        "#79562E",
        l.detailWidth - 32,
        40,
      );
      this.ui.button(m, "合成", -170, -563, 176, () =>
        unit.star < this.model.maxRank()
          ? this.mergePanel(uid)
          : this.notice("提示", "当前章节已达最高阶"),
      );
      this.ui.button(m, "下阵", 20, -563, 176, () =>
        this.act(() => this.model.deploy(uid, -1)),
      );
      this.ui.button(m, "遣返", 210, -563, 176, () =>
        this.act(() => this.model.sell(uid)),
      );
    }
    this.ui.button(
      m,
      "点击返回",
      0,
      -615,
      250,
      () => this.render(),
      "#655744",
      42,
    );
  }
  /** 分类通关弹窗，广告刷新只改变待领取候选。 */
  reward() {
    const p = this.model.state.pending;
    if (!p) return;
    const m = this.overlay(),
      u = this.ui;
    this.paper(m, "expedition-reward", 0, 0, 682, 610);
    u.text(
      m,
      p.battle.result === "win" ? "通关奖励" : "战斗结束",
      0,
      242,
      36,
      "#6C4E31",
    );
    if (p.rewardKind === "equipment") {
      const e = policy.equipment.find((e) => e.id === p.equipmentId);
      u.image(m, "equipment/" + e.id + ".png", 0, 94, 112, 112);
      u.text(m, e.name, 0, -9, 32, "#6C4E31");
      u.text(m, e.description, 0, -84, 26, "#6C4E31", 560, 90);
      u.button(m, "领取装备", 0, -214, 280, () =>
        this.act(() => this.model.claim()),
      );
    } else if (p.choices.length) {
      p.choices.forEach((id, i) => {
        const x = (i - 1) * 216,
          h = this.roster.find((h) => h.id === id),
          star = p.rewardStar || 1;
        u.text(
          m,
          star + "  " + h.name,
          x,
          140,
          28,
          policy.colors[star - 1],
          205,
        );
        u.image(m, id + "-avatar.png", x, 25, 140, 140);
        u.text(m, h.faction + " / " + h.role, x, -94, 24, "#6C4E31", 204);
        u.text(
          m,
          "拥有：" +
            this.model.state.units.filter(
              (v) => v.heroId === id && v.star === star,
            ).length,
          x,
          -142,
          23,
          "#6C4E31",
          204,
        );
        u.button(m, "选择", x, -216, 186, () =>
          this.act(() => this.model.claim(i)),
        );
      });
      const ticket = this.model.adTicket();
      u.button(
        m,
        "▶ 换一批 · 必出二阶兵种",
        0,
        -390,
        435,
        () => this.ad(() => this.model.refreshReward(ticket)),
        "#B7821C",
        86,
      );
      u.text(m, "金币 +" + p.gold, 0, 321, 26, "#ECD5A5");
      if (this.model.state.units.length >= this.config.capacity)
        u.button(
          m,
          "容量已满 · 放弃选将并结算",
          0,
          -500,
          450,
          () => this.act(() => this.model.claim(null, true)),
          "#655744",
        );
    } else {
      u.text(
        m,
        p.training ? "演武不推进关卡" : "调整阵容，继续征战",
        0,
        40,
        29,
        "#6C4E31",
      );
      u.button(m, "继续", 0, -210, 280, () =>
        this.act(() => this.model.claim()),
      );
    }
  }
  /** 装备背包分页显示，选择武将时仅展示可穿戴的闲置装备。 */
  equipmentPanel(owner = null, page = 0) {
    const m = this.overlay(),
      u = this.ui,
      items = this.model.state.expedition.equipment.filter(
        (x) => owner === null || x.owner === null,
      ),
      size = 6;
    this.paper(m, "equipment-bag", 0, 0, 665, 970);
    u.text(
      m,
      owner ? "选择装备 · 每人最多3件" : "本局装备栏",
      0,
      411,
      34,
      "#694A2C",
    );
    items.slice(page * size, (page + 1) * size).forEach((item, i) => {
      const e = policy.equipment.find((v) => v.id === item.id),
        y = 296 - i * 111;
      u.image(m, "equipment/" + e.id + ".png", -258, y, 72, 72);
      u.text(
        m,
        e.name + (item.owner ? " · 已穿戴" : " · 闲置"),
        -35,
        y,
        28,
        "#694A2C",
        400,
      );
      u.button(
        m,
        owner ? "穿戴" : "详情",
        223,
        y,
        120,
        () =>
          owner
            ? this.act(() => this.model.equip(item.uid, owner))
            : this.equipmentDetails(item),
        "#856238",
        65,
      );
    });
    if (!items.length)
      u.text(m, "暂无闲置装备\n精英关奖励装备", 0, 0, 29, "#694A2C", 570, 160);
    if (items.length > size)
      u.button(m, "下一页", 0, -342, 260, () =>
        this.equipmentPanel(owner, (page + 1) % Math.ceil(items.length / size)),
      );
    u.button(m, "返回", 0, -419, 260, () => this.render(), "#655744");
  }
  /** 装备说明提供卸下入口，不触发额外掉落或升级。 */
  equipmentDetails(item) {
    const e = policy.equipment.find((v) => v.id === item.id);
    this.notice(e.name, e.description);
    if (item.owner !== null)
      this.ui.button(this.modal, "卸下装备", 0, -84, 250, () =>
        this.act(() => this.model.equip(item.uid, null)),
      );
    else
      this.ui.button(this.modal, "选择穿戴武将", 0, -84, 310, () => {
        const m = this.overlay();
        this.paper(m, "equip-owner", 0, 0, 650, 1000);
        this.model.state.units.forEach((unit, i) =>
          this.ui.button(
            m,
            this.roster.find((h) => h.id === unit.heroId).name +
              " " +
              unit.star +
              "阶  #" +
              unit.uid,
            0,
            420 - i * 72,
            500,
            () => this.act(() => this.model.equip(item.uid, unit.uid)),
            "#856238",
            62,
          ),
        );
      });
  }
  /** 回放回血与头像棋子的死亡反馈，其余事件复用现有播放器。 */
  apply(event) {
    if (event.type === "heal") {
      const target = this.actors.get(event.target);
      if (target) this.ui.health(target, event.hp);
      return;
    }
    super.apply(event);
    if (event.type === "death") {
      const actor = this.actors.get(event.uid);
      if (actor && !actor.sp.skeletonData) actor.body.active = false;
    }
  }
}
module.exports = { ExpeditionView };
