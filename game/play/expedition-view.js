"use strict";
const { ClassicView } = require("./classic-view"),
  policy = require("./expedition-config"),
  classic = require("./classic-config");
const nodeEventView=require("./node-event-view");
const { BattleHud } = require("./battle-hud");
const hudLayout = require("./battle-hud-config");
const { showUnitDetails } = require("./unit-details");
/** 远征视图负责交互展示，奖励和装备事务交给领域服务。 */
class ExpeditionView extends ClassicView {
  /** 保留战场领取后的阵容，通过前进按钮返回路线。 */
  act(operation) {
    const levelNotice=require('./lord-level-notice'),levelBefore=levelNotice.snapshot(this.model);
    const before=new Set(this.model.state.meta.unlocked),acquired=new Set(require('./hero-acquisition').known(this.model)),runReward=this.model.state.meta.runReward,sweepReward=this.model.state.meta.sweep?.pending,diamonds=this.model.state.meta.diamonds;
    const ranks=new Map(this.model.state.units.map(unit=>[unit.uid,unit.star]));
    try {
      if (this.playing) throw Error("交战中，请等待结算");
      operation();
    } catch (e) {
      this.render();
      this.notice("提示", e.message);
      return;
    }
    levelNotice.capture(this,levelBefore);
    this.render();
    require("./upgrade-effects").show(this,ranks);
    const added=[...new Set([...this.model.state.meta.unlocked.filter(id=>!before.has(id)),...require('./hero-acquisition').known(this.model).filter(id=>!acquired.has(id))])];
    if((runReward&&!this.model.state.meta.runReward)||(sweepReward&&!this.model.state.meta.sweep?.pending))require('./diamond-reward-view').show(this,this.model.state.meta.diamonds-diamonds);
    if(added.length)require('./hero-unlock-view').show(this,added,this.model.state.meta.sectionReward);
  }
  /** 棋盘、主公资源、新人福利以及羁绊装备栏共用战斗状态。 */
  renderBattle() {
    this.battleHud = new BattleHud(this);
    require('./battle-effects').warm(this);
    require('./kill-banner').warm(this);
    const u = this.ui,
      s = this.model.state,
      m = s.meta;
    u.image(
      this.root,
      nodeEventView.active(this)?require("./node-event-config").backgrounds[nodeEventView.active(this).kind]:this.config.battleImage,
      0,
      0,
      this.config.layout.width,
      this.config.layout.height,
    );
    this.renderFormation();
    u.box(
      this.root,
      "expedition-header",
      0,
      hudLayout.scene.headerY,
      720,
      hudLayout.scene.headerHeight,
      hudLayout.scene.headerColor,
      false,
    );
    require('./expedition-header').render(this);
    const {offer} = require('./novice-rewards').current(this.model);
    if (offer && !s.pending && !nodeEventView.active(this)) {
      const name =
        offer.kind === "hero"
          ? "3阶 关羽"
          : offer.kind === "equipment"
            ? policy.equipment.find(item=>item.id===offer.id).name
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
      else require('./currency-view').icon(this,n,0,22);
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
    u.box(
      this.root,
      "expedition-footer",
      0,
      -521,
      720,
      222,
      hudLayout.scene.footerColor,
      false,
    );
    this.battleHud.render();
    this.battleStartButton = u.button(
      this.root,
      nodeEventView.active(this)?"前进":m.activeNode ? "开始" : "前进",
      229,
      -533,
      230,
      () =>
        this.playing
          ? undefined
          : nodeEventView.active(this)
            ? nodeEventView.forward(this)
            : m.activeNode
            ? this.act(() => this.start(false))
            : ((this.page = "map"), this.render()),
      "#973B22",
      72,
    );
    if(!require('./battle-speed-policy').unlocked(this.model))this.speed=1;
    this.battleSpeedButton = u.button(
      this.root,
      (s.meta.inventory[require("./speed-credit-config").item]||0)>0||s.expedition.vipSpeedActive?"×"+this.speed:"+20",
      153,
      -605,
      91,
      () => require('./vip-speed-view').toggle(this),
      "#524B3C",
      43,
    );
    if(!require('./battle-speed-policy').unlocked(this.model)){const c=require('./battle-speed-policy').config,h=c.hint;u.text(this.root,c.lockedLabel,h.x,h.y,h.font,h.color,h.width,h.height);}
    {const c=require('./speed-credit-config'),p=c.count;this.speedCountLabel=u.text(this.root,(s.meta.inventory[c.item]||0)+'次',p.x,p.y,p.font,'#EEE1B8',p.width,35);}
    if (s.pending) {if(!this.startingBattle)this.reward();}
    else {require("./section-reward-view").show(this);if(!this.modal)require("./tutorial-view").show(this);}
    require("./talent-shop-view").entry(this);
    if (this.modal) this.modal.setSiblingIndex(this.root.children.length - 1);
    require("./lord-preparation").show(this);
    require('./lord-level-notice').show(this);
  }
  /** 绘制敌我棋盘与无外框备战席；不继承旧版额外管理按钮。 */
  renderFormation() {
    const event=nodeEventView.active(this);if(event){nodeEventView.render(this,event);return;}
    const u = this.ui,
      s = this.model.state;
    for (let y = 0; y < this.config.rows * 2; y++)
      for (let x = 0; x < this.config.columns; x++) {
        const p = this.position(x, y);
        u.box(
          this.root,
          "slot-" + (y * this.config.columns + x),
          p.x,
          p.y,
          this.config.layout.boardX[y] - 7,
          this.config.layout.boardHitHeight - 8,
          hudLayout.scene.gridColors[
            (x + y) % hudLayout.scene.gridColors.length
          ],
          false,
        );
      }
    if (s.pending) {
      for (const initial of s.pending.battle.initial) {
        if(!require("./enemy-board-view").showResult(s,initial))continue;
        const final = s.pending.battle.final.find((f) => f.uid === initial.uid),
          unit = { ...initial, ...final },
          p = this.position(unit.x, unit.y),
          actor = u.actor(
            this.root,
            unit,
            p.x,
            p.y,
            this.config.layout.modelScale,
          );
        this.actors.set(unit.uid, actor);
        if (unit.hp === 0) { actor.alive = false; actor.node.active = false; }
        this.bindAttributeTap(actor, unit, initial);
        if(unit.uid<0)this.battleHud.renderEquipped(unit);
      }
    } else {
      for (const unit of require("./enemy-board-view").preview(s)?this.model.enemies():[]) {
        const p = this.position(
            unit.slot % this.config.columns,
            Math.floor(unit.slot / this.config.columns) + this.config.rows,
          ),
          actor = u.actor(
            this.root,
            { ...unit, side: "enemy" },
            p.x,
            p.y,
            this.config.layout.modelScale,
          );
        this.actors.set(unit.uid, actor);
        this.bindAttributeTap(actor, unit);
        this.battleHud.renderEquipped(unit);
      }
      for (const unit of s.units
        .filter((v) => v.slot >= 0)
        .sort((a, b) => b.slot - a.slot)) {
        const p = this.position(
          unit.slot % this.config.columns,
          Math.floor(unit.slot / this.config.columns),
        );
        this.drawFriendly(unit, p.x, p.y, this.config.layout.modelScale);
      }
    }
    this.renderReserve();
    require("./merge-hints").show(this);
  }
  /** 备战席仅保留人物、描边姓名和必要的翻页箭头。 */
  renderReserve(refresh=false) {
    const before=require('./reserve-refresh').begin(this);
    const u = this.ui,
      c = hudLayout.reserve,
      bench = this.model.state.units.filter((v) => v.slot < 0),
      size = this.config.layout.benchPageSize,
      pages = Math.max(1, Math.ceil(bench.length / size));
    this.benchPage = Math.min(this.benchPage, pages - 1);
    bench
      .slice(this.benchPage * size, (this.benchPage + 1) * size)
      .forEach((unit, i) => {
        const x = (i - (size - 1) / 2) * this.config.layout.benchSpacing,
          actor = this.drawFriendly(
            unit,
            x,
            this.config.layout.benchY,
            this.config.layout.benchScale,
          );
        actor.body.getChildByName("portrait-frame")?.destroy();
        const h = this.roster.find((h) => h.id === unit.heroId),
          label = u.text(
            this.root,
            h.name+(require("./merge-hints").eligible(this.model).has(unit.uid)?"↑":""),
            x,
            c.nameY,
            c.nameFont,
            c.nameColor,
            104,
            36,
          ),
          outline = label.node.addComponent(this.cc.LabelOutline);
        outline.color = new this.cc.Color(c.outlineColor);
        outline.width = c.outlineWidth;
      });
    if (pages > 1)
      for (const direction of [-1, 1])
        u.button(
          this.root,
          direction < 0 ? "‹" : "›",
          direction * c.arrowX,
          c.arrowY,
          c.arrowWidth,
          () => {
            if (this.modal?.isValid) return;
            this.benchPage = (this.benchPage + direction + pages) % pages;
            this.renderReserve(true);
          },
          "#191F1B44",
          c.arrowHeight,
        );
    require('./reserve-refresh').end(this,before,refresh);
  }
  /** 绑定敌方和回放中单位的只读点击，不注册布阵或合成操作。 */
  bindAttributeTap(actor, unit, snapshot = null) {
    actor.node.on(this.cc.Node.EventType.TOUCH_END, (e) => {
      e.propagationStopped = true;
      if (this.modal?.isValid) return;
      this.details(unit.heroId, unit.uid, snapshot);
    });
  }
  /** 回放复用原时间轴，只展示原有战斗控件，不创建跳过或管理按钮。 */
  start(training) {
    if(!this.config.speedOptions.includes(this.speed))this.speed=this.config.speedOptions.at(-1);
    const battle = this.model.transact(()=>{if(this.speed>1){try{require('./vip').useSpeed(this.model);}catch(_){this.speed=1;}}return this.model.fight(training);});
    this.page = "battle";
    this.startingBattle=true;try{this.render();}finally{this.startingBattle=false;}
    if (this.modal) {
      this.modal.destroy();
      this.modal = null;
    }
    for (const unit of battle.initial) {
      this.actors.get(unit.uid)?.node.destroy();
      const p = this.position(unit.x, unit.y),
        actor = this.ui.actor(
          this.root,
          unit,
          p.x,
          p.y,
          this.config.layout.modelScale,
        );
      this.actors.set(unit.uid, actor);
      this.bindAttributeTap(actor, unit, unit);
      this.battleHud.renderEquipped(unit);
    }
    require("./battle-audio").get(this).reset();
    require("./attack-audio").get(this).stop();
    require("./merge-hints").clear(this);
    this.playing = true;
    this.replay = battle;
    this.elapsed = 0;require('./battle-clock').create(this);
    this.eventIndex = 0;
    this.lastTime = Date.now();
    this.status = null;
    this.battleStartButton.getComponentInChildren(this.cc.Label).string =
      "战斗中";
    require('./lord-skill-view').show(this,()=>{if(!this.playing)return;this.lastTime=Date.now();this.timer=setInterval(()=>this.tick(),40);});
  }
  /** 结算播报只在一次正常回放结束时触发。 */
  finish(){require("./lord-skill-view").cancel(this);require("./attack-audio").get(this).stop();const active=this.playing,result=this.replay?.result;super.finish();if(active){require("./battle-audio").get(this).finish(result);require("./kill-banner").show(this,{key:result});}}
  /** 单击直接显示武将详情；拖动只布阵，取消时恢复原位置。 */
  drawFriendly(unit, x, y, scale) {
    const actor = this.ui.actor(this.root, unit, x, y, scale);
    this.actors.set(unit.uid, actor);
    const events = this.cc.Node.EventType;
    let start = null,
      moved = false;
    actor.node.on(events.TOUCH_START, (event) => {
      event.propagationStopped = true;
      if (this.playing || this.model.state.pending) return;
      start = event.getUILocation();
      moved = false;
      actor.node.setSiblingIndex(this.root.children.length - 1);
    });
    actor.node.on(events.TOUCH_MOVE, (event) => {
      event.propagationStopped = true;
      if (!start) return;
      const p = event.getUILocation();
      if (
        Math.hypot(p.x - start.x, p.y - start.y) >
        this.config.layout.dragThreshold
      ){
        if(!moved){require("./deployment-view").show(this,unit);actor.node.setSiblingIndex(this.root.children.length-1);}
        moved = true;
      }
      if (moved) {
        const q = this.root
          .getComponent(this.cc.UITransform)
          .convertToNodeSpaceAR(new this.cc.Vec3(p.x, p.y, 0));
        actor.node.setPosition(q.x, q.y);
      }
    });
    /** 统一处理节点内外松手，拖出原触摸区域仍可完成布阵。 */
    const release = (event) => {
      event.propagationStopped = true;
      if (!start) return;
      start = null;
      require("./deployment-view").clear(this);
      if (this.playing || this.model.state.pending) return;
      this.selected = unit.uid;
      if (!moved) {
        const count = this.model.state.units.filter(
          (v) => v.heroId === unit.heroId && v.star === unit.star,
        ).length;
        if (count >= this.config.mergeCount && unit.star < this.model.maxRank())
          this.mergePanel(unit.uid);
        else this.details(unit.heroId, unit.uid);
        return;
      }
      const p = event.getUILocation(),
        q = this.root
          .getComponent(this.cc.UITransform)
          .convertToNodeSpaceAR(new this.cc.Vec3(p.x, p.y, 0)),
        slot = this.slotAt(q);
      this.act(() => {
        if (slot !== null) this.model.deploy(unit.uid, slot);
        else if (q.y < this.config.layout.benchDropTop && q.y > this.config.layout.benchDropBottom) this.model.deploy(unit.uid, -1);
        else throw Error("请放在己方棋盘或备战席");
      });
    };
    actor.node.on(events.TOUCH_END, release);
    // 交战及待结算时，备战席只开放属性查看，仍禁止合成和布阵。
    actor.node.on(events.TOUCH_END, (event) => {
      if (unit.slot >= 0 || !(this.playing || this.model.state.pending)) return;
      event.propagationStopped = true;
      if (!this.modal?.isValid) this.details(unit.heroId, unit.uid);
    });
    actor.node.on(events.TOUCH_CANCEL, (event) => {
      if (event.getEventCode?.() === "touch-end") return release(event);
      event.propagationStopped = true;
      start = null;
      require("./deployment-view").clear(this);
      if (!this.playing) this.render();
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
      c = require("./equipment-paper").create(this,parent, "hero-card", x, y, width, height),
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
    this.ui.button(m, "原地合成", -230, -510, 212, () =>
      this.act(() => {this.model.merge(uid, "same");require("./attack-audio").get(this).play("merge");}),
    );
    if (this.model.canDirect())
      this.ui.button(
        m,
        "▶ 定向合成",
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
        "通过首关\n开放定向合成",
        0,
        -510,
        23,
        "#D7C39D",
        220,
        90,
      );
    this.ui.button(m, "随机合成", 230, -510, 212, () =>
      this.act(() => {this.model.merge(uid, "random");require("./attack-audio").get(this).play("merge");}),
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
        const panel=this.paper(m, "directed-selection", 0, 0, 680, 700);
        require("./paper-title").draw(this,panel,"选择定向合成目标",680,700);
        this.model.directedTargets(uid).forEach((id, i) => {
          const x = (i - 1) * 215,
            h = this.roster.find((v) => v.id === id);
          this.ui.image(m, id + "-avatar.png", x, 93, 146, 146);
          this.ui.text(m, h.name, x, -17, 29, "#694A2C", 205);
          this.ui.button(m, "选择", x, -135, 190, () =>
            this.act(() => {this.model.merge(uid, "directed", id, ticket);require("./attack-audio").get(this).play("merge");}),
          );
        });
        this.ui.button(m, "取消", 0, -282, 240, () => this.render(), "#655744");
      }, 0);
    });
  }
  /** 敌我共用只读单页属性，不加入合成、下阵或遣返按钮。 */
  details(id, uid = null, snapshot = null) {
    return showUnitDetails(this, id, uid, snapshot);
  }
  /** 分类通关弹窗，广告刷新只改变待领取候选。 */
  reward() {
    const p = this.model.state.pending;
    if (!p) return;
    if(!p.training&&p.battle.result==='loss')return require('./defeat-view').show(this,p);
    const m = this.overlay(),
      u = this.ui;
    const panel=this.paper(m, "expedition-reward", 0, 0, 682, 610);
    require("./paper-title").draw(this,panel,p.battle.result === "win" ? "通关奖励" : "战斗结束",682,610);
    if (p.rewardKind === "equipment") {
      const e = policy.equipment.find((e) => e.id === p.equipmentId);
      const icon=u.image(m, "equipment/" + e.id + ".png", 0, 94, 112, 112);
      icon.on(this.cc.Node.EventType.TOUCH_END,event=>{event.propagationStopped=true;require("./merchant-offer-view").preview(this,e.id,m);});
      u.text(m, e.name, 0, -9, 32, "#6C4E31");
      u.button(m, "领取装备", 0, -214, 280, () =>
        this.act(() => this.model.claim()),
      );
    } else if (p.choices.length) {
      const cardLayout=require("./combat-feedback-config").rewardCards;
      p.choices.forEach((id, i) => {
        const x = (i - 1) * 216,
          h = this.roster.find((h) => h.id === id),
          star = p.rewardRanks?.[i] || p.rewardStar || 1;
        u.text(
          m,
          star + "  " + h.name,
          x,
          cardLayout.nameY,
          28,
          policy.colors[star - 1],
          205,
        );
        u.image(m, id + "-avatar.png", x, cardLayout.portraitY, 140, 140);
        u.text(m, h.faction + " / " + h.role, x, cardLayout.roleY, 24, "#6C4E31", 204);
        u.text(
          m,
          "拥有：" +
            this.model.state.units.filter(
              (v) => v.heroId === id && v.star === star,
            ).length,
          x,
          cardLayout.ownedY,
          23,
          "#6C4E31",
          204,
        );
        u.button(m, "选择", x, cardLayout.buttonY, 186, () =>
          this.act(() => this.model.claim(i)),
        );
        require('./reward-merge-hint').draw(this,m,id,star,x);
      });
      const ticket = this.model.adTicket(),rc=require('./reward-refresh-config'),coins=this.model.state.meta.inventory[rc.item]||0,expected={id:p.id,coins:p.coinRefreshes||0,ads:p.refreshes};
      require("./reward-refresh-view").button(this,m,coins,Math.max(0,require("./vip").perks(this.model).data_1-p.refreshes),()=> (this.model.state.meta.inventory[rc.item]||0)>=rc.cost?this.act(()=>this.model.refreshReward(null,expected)):this.ad(()=>this.model.refreshReward(ticket,expected)));
      u.text(m, "金币 +" + p.gold, 0, 321, 26, "#ECD5A5");
      if (require('./reserve-policy').full(this.model.rules,this.model.state.units.length))
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
    const panel=this.paper(m, "equipment-bag", 0, 0, 665, 970);
    require("./paper-title").draw(this,panel,owner ? "选择装备 · 每人最多3件" : "本局装备栏",665,970);
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
            ? (require("./equipment-refresh").equip(this,item.uid,owner)&&m.destroy())
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
    require('./equipped-item-details').showEquippedItem(this,this.root,item,()=>{},item.owner===null);
  }
  /** 根据战报事件更新模型朝向和动作；数值与命中仍由模拟器决定。 */
  apply(event) {
    const kill=require("./battle-audio").get(this).event(event,this.replay?.initial||[]);
    require("./kill-banner").show(this,kill);
    const source=this.replay?.initial?.find(u=>u.uid===event.uid);
    const sound=require("./attack-audio");sound.get(this).play(sound.kind(event,source));
    const cc = this.cc,
      u = this.ui,
      actor = this.actors.get(event.uid),
      target = this.actors.get(event.target);
    if(event.type==='ability'&&actor){if(target&&target!==actor)u.face(actor,target.node.position.x-actor.node.position.x,target.node.position.y-actor.node.position.y);u.animate(actor,'skill2',false,{speed:this.speed});require('./skill-effects').ability(this,actor,target,event);return;}
    if(event.type==='shield'&&target){require('./combat-text').show(this,target,require('./combat-text-config').status.shield+' '+event.amount,'gain');return;}
    if(event.type==='gain'&&target){if(event.effect)require('./native-effects').play(this,event.effect,target.node,0,40,{duration:require('./equipment-vfx-config').duration});require('./combat-text').show(this,target,event.text,'gain');return;}
    if(event.type==='equipment'&&actor){require('./equipment-vfx').cast(this,event);return;}
    if(event.type==='status'&&target){const benefit=require('./combat-text-config').beneficial[event.effect];const text=benefit||require('./combat-text-config').status[event.effect];if(text)require('./combat-text').show(this,target,text,benefit?'gain':'damage');require('./skill-effects').status(this,target,event);return;}
    if(event.type==='evade'&&target){require('./combat-text').show(this,target,require('./combat-text-config').status.evade,'gain');return;}
    if (event.type === "heal") {
      if (target){u.health(target, event.hp);require('./battle-effects').heal(this,target);require('./combat-text').show(this,target,event.amount,'heal');}
      return;
    }
    if (event.type === "move" && actor) {
      const p = this.position(event.x, event.y);
      u.face(actor, p.x - actor.node.position.x, p.y - actor.node.position.y);
      u.animate(actor, "run", true, { speed: this.speed });
      cc.Tween.stopAllByTarget(actor.node);
      cc.tween(actor.node)
        .to(event.duration / this.speed, { position: new cc.Vec3(p.x, p.y, 0) })
        .call(() => {
          if (actor.alive)
            u.animate(actor, "idle", true, { speed: this.speed });
        })
        .start();
    }
    if (event.type === "attack" && actor) {
      require("./battle-effects").cast(this,actor,event);
      if (target && target !== actor)
        u.face(
          actor,
          target.node.position.x - actor.node.position.x,
          target.node.position.y - actor.node.position.y,
        );
      u.animate(actor, event.skill ? "skill2" : "skill1", false, {
        speed: this.speed,
        contactDelay: this.config.attackDelay,
      });
      if (target && event.ranged) this.projectile(actor, target, event.skill);
    }
    if (event.type === "damage" && target) {
      u.health(target, event.hp);
      require("./battle-effects").hit(this,this.actors.get(event.actor),target,event);
      this.damageText(target, event.damage, event.critical, event.skill);
    }
    if (event.type === "death" && actor) {
      require('./death-view').hide(this,actor);
    }
  }
  /** 物理远程绘制箭矢，法系绘制法术光点；两者沿实际目标方向飞行。 */
  projectile(actor, target, skill) {
    require('./battle-effects').projectile(this,actor,target,skill);
  }
}
module.exports = { ExpeditionView };
