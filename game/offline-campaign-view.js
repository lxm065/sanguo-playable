const rules = require('./offline-rules');
const { Campaign } = require('./offline-campaign');

/** 从现有客户端英雄表读取名称、美术 ID 与基础数值。 */
function rosterFromGame(api) {
  return Object.entries(api.App.ConfigMgr.getHeroInfo()).map(([id, row]) => ({
    id: Number(id), name: String(row.name || ''), pic: Number(row.pic),
    icon: Number((api.App.ConfigMgr.getModelInfoById(row.model_id) || {}).model),
    cost: Math.max(1, Number(row.cost) || 1), color: Number(row.color),
    hp: Math.max(1, Number(row.hp) || rules.fallbackHp),
    attack: Math.max(1, Number(row.phy_att) || Number(row.stg_att) || rules.fallbackAttack),
    armor: Math.max(0, Number(row.phy_def) || rules.fallbackArmor),
    race: String(row.race), profession: String(row.profession),
  })).filter(hero => hero.id > 0 && hero.id !== Number(api.App.ConfigMgr.defaultKey) && hero.pic > 0 && hero.color === 1 && hero.name)
    .sort((a, b) => a.cost - b.cost || a.id - b.id).slice(0, rules.rosterLimit);
}

class CampaignView {
  /** 保存注入的游戏依赖，资源通过原 Cocos 加载器管理。 */
  constructor(api) {
    this.api = api;
    this.root = null;
    this.model = null;
    this.selected = null;
    this.frames = null;
    this.timer = null;
    this.pictures = new Map();
    this.picturePromises = new Map();
    this.message = '选择英雄，再点棋盘布阵；同英雄三合一升星';
  }

  /** 加载英雄头像到内存；失败时展示文字，不阻断游戏。 */
  picture(heroId) {
    if (this.pictures.has(heroId)) return Promise.resolve(this.pictures.get(heroId));
    if (this.picturePromises.has(heroId)) return this.picturePromises.get(heroId);
    const hero = this.model.heroes.get(heroId);
    const promise = new Promise(resolve => {
      /** 同时兼容原资源加载器与纯本地图片加载器。 */
      const loaded = (error, frame) => {
          if (!error && frame) { frame.addRef(); this.pictures.set(heroId, frame); }
          resolve(error ? null : frame);
        };
      if (this.api.loadPortrait) this.api.loadPortrait(hero.icon, loaded);
      else this.api.App.ResLoader.loadRes(this.api.BundleConfig.BUNDLE_ICON, 'hero/' + hero.icon + '/spriteFrame', this.cc.SpriteFrame, null, loaded);
    });
    this.picturePromises.set(heroId, promise);
    return promise;
  }

  /** 建立覆盖原界面的本地玩法画布，并恢复独立存档。 */
  async open() {
    if (this.root && this.root.isValid) return;
    this.cc = await this.api.loadEngine();
    if (this.root && this.root.isValid) return;
    if (!this.model) {
      const storage = {
        /** 微信本地存储仅保存离线规则自己的数据。 */
        read() { const value = wx.getStorageSync(rules.storageKey); return value ? JSON.parse(value) : null; },
        /** 写入失败向上传播，不能显示虚假的保存成功。 */
        write(value) { wx.setStorageSync(rules.storageKey, JSON.stringify(value)); },
      };
      this.model = new Campaign(rules, this.api.roster || rosterFromGame(this.api), storage);
    }
    const cc = this.cc, canvas = cc.director.getScene().getComponentInChildren(cc.Canvas);
    if (!canvas) throw new Error('当前场景没有可用的游戏画布');
    const parentSize = canvas.node.getComponent(cc.UITransform).contentSize;
    this.root = new cc.Node('OfflineCampaign');
    this.root.layer = cc.Layers.Enum.UI_2D;
    const transform = this.root.addComponent(cc.UITransform);
    transform.setContentSize(720, 1280);
    // 原游戏自定义渲染器按 sortingPriority 排序，普通兄弟顺序不足以置顶。
    transform.sortingEnabled = true;
    transform.sortingPriority = Math.max(0, ...cc.director.getScene().getComponentsInChildren(cc.UITransform).map(t => Number(t.sortingPriority) || 0)) + 1;
    const scale = Math.min(parentSize.width / 720, parentSize.height / 1280);
    this.root.setScale(scale, scale, 1);
    canvas.node.addChild(this.root);
    this.root.setSiblingIndex(canvas.node.children.length - 1);
    this.root.addComponent(cc.BlockInputEvents);
    this.render();
    console.info('[offline-campaign] opened stage', this.model.state.stage);
  }

  /** 关闭界面停止回放；已生成结算保留在存档中。 */
  close() {
    clearTimeout(this.timer);
    this.timer = null;
    this.frames = null;
    if (this.root && this.root.isValid) this.root.destroy();
    this.root = null;
  }

  /** 创建有明确点击范围的矩形面板。 */
  box(name, x, y, width, height, fill, callback) {
    const cc = this.cc, node = new cc.Node(name);
    node.layer = this.root.layer;
    node.addComponent(cc.UITransform).setContentSize(width, height);
    node.setPosition(x, y);
    this.root.addChild(node);
    const graphics = node.addComponent(cc.Graphics);
    graphics.fillColor = new cc.Color(fill);
    graphics.roundRect(-width / 2, -height / 2, width, height, 10);
    graphics.fill();
    if (callback) node.on(cc.Node.EventType.TOUCH_END, () => this.act(callback));
    return node;
  }

  /** 创建可读文本，使用原生系统字体以支持离线中文。 */
  text(value, x, y, size = 22, color = '#F5E7C5', width = 660, parent = this.root) {
    const cc = this.cc, node = new cc.Node('text');
    node.layer = parent.layer;
    node.addComponent(cc.UITransform).setContentSize(width, size * 2.2);
    node.setPosition(x, y);
    parent.addChild(node);
    const label = node.addComponent(cc.Label);
    label.string = String(value);
    label.fontSize = size;
    label.lineHeight = size + 3;
    label.color = new cc.Color(color);
    label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
    label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    return node;
  }

  /** 操作失败显示原因，成功后刷新界面与经济。 */
  act(callback) {
    try { callback(); } catch (error) { this.message = error.message; console.warn('[offline-campaign]', error.message); }
    this.render();
  }

  /** 创建带文字的操作按钮。 */
  button(value, x, y, width, callback, color = '#685438') {
    const node = this.box(value, x, y, width, 58, color, callback);
    this.text(value, 0, 0, 22, '#FFF5DA', width - 10, node);
    return node;
  }

  /** 显示原版头像、名称、星级与当前生命。 */
  card(unit, x, y, width, height, callback, enemy = false) {
    const hero = this.model.heroes.get(unit.heroId), selected = unit.uid === this.selected;
    const node = this.box('hero-' + unit.uid, x, y, width, height, selected ? '#846A34' : enemy ? '#522D34' : '#25464A', callback);
    const spriteNode = new this.cc.Node('portrait');
    spriteNode.layer = node.layer;
    spriteNode.addComponent(this.cc.UITransform).setContentSize(height - 35, height - 35);
    spriteNode.setPosition(0, 9);
    const sprite = spriteNode.addComponent(this.cc.Sprite);
    sprite.sizeMode = this.cc.Sprite.SizeMode.CUSTOM;
    node.addChild(spriteNode);
    this.picture(unit.heroId).then(frame => { if (frame && spriteNode.isValid) sprite.spriteFrame = frame; });
    this.text(hero.name + ' ' + '★'.repeat(unit.star), 0, -height / 2 + 15, 17, '#FFE7AB', width - 4, node);
    if (unit.maxHp) {
      this.text(unit.hp + '/' + unit.maxHp, 0, height / 2 - 11, 15, unit.hp > 0 ? '#B8EDC7' : '#D58F89', width, node);
      if (unit.hp <= 0) this.text('败退', 0, 10, 24, '#FF8888', width, node);
    }
  }

  /** 绘制敌我棋盘、备战名单和商店。 */
  render() {
    if (!this.root || !this.root.isValid) return;
    for (const child of [...this.root.children]) { child.removeFromParent(); child.destroy(); }
    const s = this.model.state;
    this.box('background', 0, 0, 720, 1280, '#192A30');
    this.text(rules.title + ' · 第 ' + s.stage + ' 关', 30, 592, 32);
    this.button(this.api.standalone ? '规则' : '返回', -292, 594, 106, () => {
      if (this.api.standalone) this.message = '选英雄后点棋盘布阵；三合一升星，战胜敌军领取金币';
      else this.close();
    });
    this.text('金币 ' + s.gold + '  |  上阵 ' + s.units.filter(u => u.slot >= 0).length + '/' + rules.deployedLimit + '  |  已胜 ' + s.wins + ' 场', 0, 542, 23);
    this.text('本地自动战斗规则 · 原版英雄素材', 0, 505, 18, '#A4B5B5');
    const allies = this.frames ? this.replayUnits.filter(u => u.side === 'ally') : s.units.filter(u => u.slot >= 0);
    const enemies = this.frames ? this.replayUnits.filter(u => u.side === 'enemy') : this.model.enemies();
    for (let slot = 0; slot < rules.columns * rules.rows; slot++) {
      const x = (slot % rules.columns - 1.5) * 160;
      const enemyY = 405 - Math.floor(slot / rules.columns) * 115;
      const allyY = 95 - Math.floor(slot / rules.columns) * 115;
      const enemy = enemies.find(u => u.slot === slot), ally = allies.find(u => u.slot === slot);
      this.box('enemy-slot', x, enemyY, 150, 105, '#332E35');
      if (enemy) this.card(enemy, x, enemyY, 150, 105, null, true);
      this.box('ally-slot', x, allyY, 150, 105, '#233C43', () => {
        if (this.frames) return;
        if (this.selected) { this.model.deploy(this.selected, slot); this.message = '阵容已保存'; }
        else if (ally) this.selected = ally.uid;
      });
      if (ally) this.card(ally, x, allyY, 150, 105, () => {
        if (this.frames) return;
        if (this.selected && this.selected !== ally.uid) this.model.deploy(this.selected, slot);
        else this.selected = ally.uid;
      });
    }
    this.text(this.frames ? '交战中' : '我方布阵 · 同族或同职业两人获得增益', 0, 187, 22, '#C1DCA7');
    this.text(this.message, 0, -106, 20, '#FFD986');
    if (this.frames) {
      this.text('战斗正在本地计算并回放', 0, -280, 27);
      this.text('血量、护甲、暴击和站位决定胜负', 0, -340, 22, '#A4B5B5');
      this.button('跳过动画', 0, -550, 340, () => this.finishReplay(), '#766130');
      return;
    }
    if (s.pending) {
      const result = s.pending.result === 'win' ? '胜利' : s.pending.result === 'loss' ? '战败，调整阵容再战' : '回合上限，平局';
      this.text(result, 0, -240, 35, '#F6D174');
      this.text('本场奖励：' + s.pending.gold + ' 金币', 0, -310, 28);
      this.text('结果已保存，领取一次后生效', 0, -365, 22, '#A4B5B5');
      this.button('领取奖励', 0, -550, 400, () => {
        this.model.claim(); this.selected = null; this.message = '奖励已保存，可以继续远征';
      }, '#896726');
      return;
    }
    s.units.forEach((unit, index) => {
      const x = (index % 4 - 1.5) * 160, y = -192 - Math.floor(index / 4) * 87;
      this.card(unit, x, y, 150, 80, () => { this.selected = unit.uid; this.message = '已选 ' + this.model.heroes.get(unit.heroId).name + '，点击上方棋盘布阵'; });
    });
    s.shop.forEach((id, index) => {
      const x = (index - 1) * 225, hero = this.model.heroes.get(id);
      this.button(hero ? hero.name + ' / ' + hero.cost + '金' : '已售出', x, -405, 214, () => { this.model.buy(index); this.message = '招募成功，三张相同英雄自动升星'; }, '#4D5943');
    });
    this.button('刷新 ' + rules.refreshCost + '金', -225, -487, 205, () => this.model.refresh());
    this.button('选中下阵', 0, -487, 205, () => this.model.deploy(this.selected, -1));
    this.button('出售选中', 225, -487, 205, () => { this.model.sell(this.selected); this.selected = null; });
    this.button('开始战斗', 0, -574, 440, () => this.startBattle(), '#896726');
    this.text('阵容与金币自动存档 · 不接入线上奖励', 0, -625, 18, '#A4B5B5');
  }

  /** 计算战报后按节奏播放，不通过游戏服务器。 */
  startBattle() {
    const battle = this.model.fight();
    this.frames = battle.frames;
    this.replayUnits = battle.initial;
    this.frameIndex = 0;
    this.message = '战斗开始';
    this.timer = setTimeout(() => this.tick(), rules.tickMs);
    console.info('[offline-campaign] fight', battle.result, battle.frames.length);
  }

  /** 应用一条伤害事件并更新生命显示。 */
  tick() {
    if (!this.root || !this.root.isValid || !this.frames) return;
    const event = this.frames[this.frameIndex++];
    if (!event) { this.finishReplay(); this.render(); return; }
    const actor = this.replayUnits.find(u => u.uid === event.actor), target = this.replayUnits.find(u => u.uid === event.target);
    target.hp = event.hp;
    this.message = actor.name + ' → ' + target.name + '  -' + event.damage + (event.critical ? ' 暴击' : '');
    this.render();
    this.timer = setTimeout(() => this.tick(), rules.tickMs);
  }

  /** 跳过或结束回放只影响动画，不重新结算。 */
  finishReplay() {
    clearTimeout(this.timer);
    this.timer = null;
    this.frames = null;
    this.message = '本场结算已保存';
  }
}

/** 仅替换本地远征入口，其他模式继续由原游戏处理。 */
function install(api) {
  if (!rules.enabled) return;
  const screen = new CampaignView(api);
  const originalStart = api.MainScene.prototype.start;
  api.MainScene.prototype.start = async function startLocalCampaign() {
    await originalStart.call(this);
    await screen.open();
  };
  const originalOpen = api.App.UIMgr.open;
  api.App.UIMgr.open = function openLocalCampaign(id, ...args) {
    if (id === api.UIId.MapPanel) {
      screen.open().catch(error => api.App.ToastMgr.show(error.message));
      return;
    }
    return originalOpen.call(this, id, ...args);
  };
}

module.exports = { install, rosterFromGame, CampaignView };
