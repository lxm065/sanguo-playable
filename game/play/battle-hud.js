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
    require("./team-equipment-buffs").render(this.view);
    this.renderBonds();
    this.renderEquipment();
    for (const unit of this.view.model.state.units) this.renderEquipped(unit);
  }
  /** 用单字徽章和独立人数角标替代两行按钮文字。 */
  renderBonds() {
    const v = this.view,
      u = v.ui,
      c = config.bonds;
    const title=u.node(v.root,"bond-entry",-309,c.y,98,55);u.text(title,"羁绊",0,0,26,"#7AB755",98);require("./merge-notification").show(v,title);
    bonds(
      v.model.state.units.filter((x) => x.slot >= 0),
      v.roster,require("./bond-activation").state(v.model),
    )
      .filter((b) => b.count)
      .forEach((b, i) => {
        const [symbol, color] = c.symbols[b.id]||[b.symbol,b.color],
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
          require('./bond-detail-view').show(v,b);
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
    const previous = v.root.getChildByName("equipment-inventory");
    if (previous) { previous.removeFromParent(); previous.destroy(); }
    const panel = u.node(v.root, "equipment-inventory");
    v.equipmentPage = Math.min(v.equipmentPage || 0, pages - 1);
    const title=u.node(panel,"equipment-entry",-309,c.y,98,55);u.text(title,"装备",0,0,26,"#7AB755",98);require("./notification-view").badge(v,title,"equipment",38,20);title.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;v.openHandbook();v.handbook.tab="equipment";v.handbook.render();});
    items
      .slice(v.equipmentPage * capacity, (v.equipmentPage + 1) * capacity)
      .forEach((item, i) => {
        const n = u.box(
          panel,
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
    v.equipmentPager={pages,refresh:()=>this.renderEquipment()};
    const hit=u.node(panel,'equipment-swipe-area',c.x+(c.columns-1)*c.gap/2,c.y-(c.rows-1)*c.rowGap/2,c.columns*c.gap,c.rows*c.rowGap);hit.setSiblingIndex(0);require('./equipment-swipe').bind(v,hit,e=>this.point(e));
  }
  /** 在敌我单位血条上方显示其三件装备，与详情共用同一归属。 */
  renderEquipped(unit) {
    const v = this.view,
      actor = v.actors.get(unit.uid);
    if (!actor) return;
    const c = config.unit,
      items = unit.uid < 0 ? (unit.equipment || []) : v.model.state.expedition.equipment.filter(
        (e) => e.owner === unit.uid,
      );
    const row = v.ui.node(actor.status, "equipped-icons", 0, c.equipmentY);
    items.forEach((item, i) =>
      v.ui.image(
        row,
        "equipment/" + item.id + ".png",
        (i - (items.length - 1) / 2) * c.equipmentGap,
        0,
        c.equipmentSize,
        c.equipmentSize,
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
      moved = false,
      swipe = false;
    node.on(events.TOUCH_START, (e) => {
      e.propagationStopped = true;
      if (v.playing || v.model.state.pending) return;
      start = this.point(e);
      moved = false;swipe=false;
    });
    node.on(events.TOUCH_MOVE, (e) => {
      e.propagationStopped = true;
      if (!start || v.playing || v.model.state.pending) return;
      const p = this.point(e);
      if (
        !moved &&
        Math.hypot(p.x - start.x, p.y - start.y) > v.config.layout.dragThreshold
      ) {
        const intent=require('./equipment-swipe').intent(start,p,v.equipmentPager?.pages||1);if(!intent)return;
        moved = true;swipe=intent==='page';
        if(!swipe)this.beginDrag(item, node);
      }
      if (this.drag) this.drag.ghost.setPosition(p.x, p.y);
    });
    /** 节点外松手会被 Cocos 改成取消事件，原始事件码仍为 TOUCH_END。 */
    const release = (e) => {
      e.propagationStopped = true;
      if (!start) return;
      const origin=start;start = null;
      const point=this.point(e);
      if(swipe){this.clearDrag();require('./equipment-swipe').turn(v,origin,point);return;}
      const target = equipmentTarget(point, this.positions());
      this.clearDrag();
      if (v.playing || v.model.state.pending) return;
      if (moved) {
        if(require("./node-event-view").saleHit(v,point)){v.act(()=>v.model.nodeEvents.sell("equipment",item.uid));return;}
        if (target !== null) require("./equipment-refresh").equip(v,item.uid,target);
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
      markers = [];
    markers.push(...require('./equipment-recommendation-view').show(v,item,v.model.state.units,v.model.state.expedition.equipment));
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
        r.percent === null ? r.unlockLevel+"级主公开放" : r.percent + "%",
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
