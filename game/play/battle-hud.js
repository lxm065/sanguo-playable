"use strict";
const config = require("./battle-hud-config"),
  policy = require("./expedition-config"),
  classic = require("./classic-config"),
  { bonds } = require("./expedition-stats"),
  {
    recommendedUnits,
    equipmentTarget,
    lordSummary,
  } = require("./battle-hud-query");
/** 只负责战斗栏与拖动表现，所有穿戴通过原有装备事务执行。 */
class BattleHud {
  /** 绑定本次视图，拖动中的临时节点不进入存档。 */
  constructor(view) {
    this.view = view;
    this.drag = null;
  }
  /** 建立无溢出的羁绊徽章和直接可拖动的装备图标。 */
  render() {
    this.renderBonds();
    this.renderEquipment();
    for (const unit of this.view.model.state.units) this.renderEquipped(unit);
  }
  /** 用单字徽章和独立人数角标替代两行按钮文字。 */
  renderBonds() {
    const v = this.view,
      u = v.ui,
      c = config.bonds;
    u.text(v.root, "羁绊", -309, c.y, 26, "#7AB755", 98);
    bonds(
      v.model.state.units.filter((x) => x.slot >= 0),
      v.roster,
    )
      .filter((b) => b.count)
      .forEach((b, i) => {
        const [symbol, color] = c.symbols[b.id],
          n = u.box(
            v.root,
            "bond-" + b.id,
            c.x + i * c.gap,
            c.y,
            c.size,
            c.size,
            b.level ? color : c.inactive,
          );
        u.text(n, symbol, -3, 3, c.font, "#F3E8CA", c.size - 10, c.size - 8);
        u.box(n, "count", c.countX, c.countY, 25, 24, "#26251E");
        u.text(n, b.count, c.countX, c.countY, c.countFont, "#FFF4D2", 24, 24);
        n.on(v.cc.Node.EventType.TOUCH_END, (e) => {
          e.propagationStopped = true;
          if (v.playing) return;
          v.notice(
            b.name,
            b.effect
              .replace("{0}", b.values[0])
              .replace("{1}", b.values[1])
              .replace("{2}", b.values[2] || "") +
              "\n不同武将：" +
              b.count +
              "，当前档位：" +
              b.level,
          );
        });
      });
  }
  /** 两行直接展示闲置装备，超过当前页容量时提供翻页。 */
  renderEquipment() {
    const v = this.view,
      u = v.ui,
      c = config.equipment,
      items = v.model.state.expedition.equipment.filter(
        (e) => e.owner === null,
      ),
      capacity = c.columns * c.rows,
      pages = Math.max(1, Math.ceil(items.length / capacity));
    v.equipmentPage = Math.min(v.equipmentPage || 0, pages - 1);
    u.text(v.root, "装备", -309, c.y, 26, "#7AB755", 98);
    items
      .slice(v.equipmentPage * capacity, (v.equipmentPage + 1) * capacity)
      .forEach((item, i) => {
        const n = u.box(
          v.root,
          "equipment-drag-" + item.uid,
          c.x + (i % c.columns) * c.gap,
          c.y - Math.floor(i / c.columns) * c.rowGap,
          c.size,
          c.size,
          "#574B39",
        );
        u.image(
          n,
          "equipment/" + item.id + ".png",
          0,
          0,
          c.size - c.iconInset,
          c.size - c.iconInset,
        );
        this.bindEquipment(n, item);
      });
    if (pages > 1)
      u.button(
        v.root,
        "›",
        c.pageX,
        c.pageY,
        c.pageWidth,
        () => {
          v.equipmentPage = (v.equipmentPage + 1) % pages;
          v.render();
        },
        "#665039",
        44,
      );
  }
  /** 在己方单位血条上方显示其三件装备，与详情共用同一归属。 */
  renderEquipped(unit) {
    const v = this.view,
      actor = v.actors.get(unit.uid);
    if (!actor) return;
    const c = config.targeting,
      items = v.model.state.expedition.equipment.filter(
        (e) => e.owner === unit.uid,
      ),
      scale =
        unit.slot >= 0
          ? v.config.layout.modelScale
          : v.config.layout.benchScale;
    items.forEach((item, i) =>
      v.ui.image(
        actor.node,
        "equipment/" + item.id + ".png",
        (i - (items.length - 1) / 2) * c.equippedGap,
        c.equippedY * scale,
        c.equippedSize,
        c.equippedSize,
      ),
    );
  }
  /** 将触摸坐标换算到战场，供浮动图标和命中检测共用。 */
  point(event) {
    const v = this.view,
      p = event.getUILocation();
    return v.root
      .getComponent(v.cc.UITransform)
      .convertToNodeSpaceAR(new v.cc.Vec3(p.x, p.y, 0));
  }
  /** 按显示中的己方棋子生成命中区域，隐藏备战页不参与。 */
  positions() {
    const v = this.view;
    return v.model.state.units
      .map((unit) => {
        const a = v.actors.get(unit.uid);
        return a
          ? {
              uid: unit.uid,
              x: a.node.position.x,
              y: a.node.position.y,
              scale:
                unit.slot >= 0
                  ? v.config.layout.modelScale
                  : v.config.layout.benchScale,
            }
          : null;
      })
      .filter(Boolean);
  }
  /** 拖动时显示推荐，点击仍可查看装备；取消和空白落点均不写存档。 */
  bindEquipment(node, item) {
    const v = this.view,
      events = v.cc.Node.EventType;
    let start = null,
      moved = false;
    node.on(events.TOUCH_START, (e) => {
      e.propagationStopped = true;
      if (v.playing || v.model.state.pending) return;
      start = this.point(e);
      moved = false;
    });
    node.on(events.TOUCH_MOVE, (e) => {
      e.propagationStopped = true;
      if (!start || v.playing || v.model.state.pending) return;
      const p = this.point(e);
      if (
        !moved &&
        Math.hypot(p.x - start.x, p.y - start.y) > v.config.layout.dragThreshold
      ) {
        moved = true;
        this.beginDrag(item, node);
      }
      if (this.drag) this.drag.ghost.setPosition(p.x, p.y);
    });
    /** 节点外松手会被 Cocos 改成取消事件，原始事件码仍为 TOUCH_END。 */
    const release = (e) => {
      e.propagationStopped = true;
      if (!start) return;
      start = null;
      const target = equipmentTarget(this.point(e), this.positions());
      this.clearDrag();
      if (v.playing || v.model.state.pending) return;
      if (moved) {
        if (target !== null) v.act(() => v.model.equip(item.uid, target));
      } else v.equipmentDetails(item);
    };
    node.on(events.TOUCH_END, release);
    node.on(events.TOUCH_CANCEL, (e) => {
      e.propagationStopped = true;
      if (e.getEventCode() === v.cc.Input.EventType.TOUCH_END) {
        release(e);
        return;
      }
      start = null;
      this.clearDrag();
    });
  }
  /** 仅推荐仍有空槽的可见友军，金色标签不覆盖血条或装备。 */
  beginDrag(item, source) {
    this.clearDrag();
    const v = this.view,
      c = config.targeting,
      markers = [],
      ids = recommendedUnits(
        item,
        v.model.state.units,
        v.model.state.expedition.equipment,
      );
    for (const uid of ids) {
      const a = v.actors.get(uid);
      if (!a) continue;
      const n = v.ui.box(
        a.node,
        "equipment-recommended",
        0,
        c.recommendY,
        c.recommendWidth,
        c.recommendHeight,
        "#393017",
      );
      v.ui.text(
        n,
        "推荐",
        0,
        0,
        c.recommendFont,
        "#FFE343",
        c.recommendWidth - 6,
        c.recommendHeight,
      );
      markers.push(n);
    }
    const ghost = v.ui.image(
      v.root,
      "equipment/" + item.id + ".png",
      0,
      0,
      c.ghostSize,
      c.ghostSize,
    );
    ghost.name = "equipment-drag-ghost";
    if (source)
      (
        source.getComponent(v.cc.UIOpacity) ||
        source.addComponent(v.cc.UIOpacity)
      ).opacity = 0;
    this.drag = { ghost, markers, source };
  }
  /** 清除纯表现节点，不能在取消时移动或销毁真实装备。 */
  clearDrag() {
    if (!this.drag) return;
    if (this.drag.source?.isValid)
      this.drag.source.getComponent(this.view.cc.UIOpacity).opacity = 255;
    for (const n of [this.drag.ghost, ...this.drag.markers])
      if (n.isValid) n.destroy();
    this.drag = null;
  }
  /** 主公头像弹窗展示实际等级、经验、人数、技能和刷新概率。 */
  lordDetails() {
    const v = this.view;
    if (v.playing || v.model.state.pending) return;
    const u = v.ui,
      c = config.lord,
      m = v.overlay(),
      lord = v.progress.lord(),
      s = lordSummary(v.model);
    v.paper(m, "battle-lord-details", 0, 0, c.width, c.height);
    u.text(m, lord.name, 0, c.titleY, 35, "#6A4B30", c.width - 40);
    u.portrait(
      m,
      lord.portrait,
      c.avatarX,
      c.avatarY,
      c.avatarSize,
      c.avatarSize,
      classic.portraitCrop,
    );
    u.text(m, "等级 " + s.level, c.avatarX, c.levelY, 25, "#813694", 180);
    u.text(
      m,
      s.nextExperience === null
        ? "当前最高等级"
        : s.experience + "/" + s.nextExperience,
      c.avatarX,
      c.experienceY,
      24,
      "#665039",
      200,
    );
    u.text(
      m,
      "可上阵数量：" + s.limit,
      c.avatarX,
      c.limitY,
      25,
      "#286E36",
      230,
    );
    u.box(
      m,
      "lord-skill",
      c.skillX,
      c.skillY,
      c.skillWidth,
      c.skillHeight,
      "#9A7B59",
    );
    u.text(
      m,
      lord.skillName,
      c.skillX,
      c.skillY + 55,
      29,
      "#FFF3DD",
      c.skillWidth - 20,
    );
    u.text(
      m,
      lord.skillDescription,
      c.skillX,
      c.skillY - 30,
      27,
      "#FFF3DD",
      c.skillWidth - 30,
      120,
    );
    u.text(m, "【换一批】概率", 0, c.chanceTitleY, 29, "#604529", 500);
    s.ranks.forEach((r, i) => {
      const y = c.chanceStartY - i * c.chanceGap;
      u.box(
        m,
        "rank-chance-" + r.star,
        22,
        y,
        c.chanceWidth,
        c.chanceHeight,
        "#A38361",
      );
      u.box(m, "rank-badge", -145, y, 43, 44, policy.colors[r.star - 1]);
      u.text(m, r.star, -145, y, 29, "#FFFFFF", 40, 44);
      u.text(
        m,
        r.percent === null ? "暂未开放" : r.percent + "%",
        22,
        y,
        25,
        "#FFF2D7",
        c.chanceWidth - 20,
        c.chanceHeight,
      );
    });
    u.text(
      m,
      "【换一批】当前必出" + s.guaranteedRank + "阶兵种",
      0,
      c.hintY,
      24,
      "#63482D",
      c.width - 36,
    );
    u.text(m, "点击空白处关闭", 0, c.closeY, 27, "#F8ECD7", 500);
    m.on(v.cc.Node.EventType.TOUCH_END, (e) => {
      if (e.target === m) {
        m.destroy();
        v.modal = null;
      }
    });
  }
}
module.exports = { BattleHud };
