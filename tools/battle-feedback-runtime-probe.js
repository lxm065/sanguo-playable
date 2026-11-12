'use strict';

/** 只在离线验收包使用两个正式回放入口与真实模型，按反馈生命周期留证。 */
async function start(api, runID, config) {
  const fs = api.getFileSystemManager();
  const base = api.env.USER_DATA_PATH + '/quiet-' + runID;
  const report = { runID, phase: 'waiting-ready', screens: [], samples: [] };
  let root, hosts = [];

  /** 写出与本次运行绑定的截图和断言状态。 */
  function save() { fs.writeFileSync(base + '.json', JSON.stringify(report, null, 2), 'utf8'); }

  /** 有界等待启动、资源加载以及官方截图回执。 */
  async function waitFor(check) {
    const end = Date.now() + config.waitMs;
    while (!check()) {
      if (Date.now() >= end) throw Error('战斗反馈验收等待超时');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /** 在真实引擎完成绘制后让宿主抓取一张模拟器图。 */
  async function capture(cc, index, name) {
    await new Promise(resolve => cc.director.once(cc.Director.EVENT_AFTER_DRAW, resolve));
    report.phase = 'capture-ready'; report.captureIndex = index; save();
    await waitFor(() => {
      try { fs.accessSync(base + '-capture-' + index + '.ack'); return true; }
      catch { return false; }
    });
    report.screens.push({ name, file: 'frame-' + String(index).padStart(3, '0') + '.jpg' });
  }

  save();
  try {
    await waitFor(() => globalThis.__sanguoPlay?.ready);
    const sample = globalThis.__sanguoPlay, cc = sample.cc, ui = sample.view.ui;
    const native = require('./native-effects'), effects = require('./battle-effects');
    const replayViews = [require('./expedition-view').ExpeditionView, require('./challenge-view').ChallengeView,
      require('./solo-challenge-view').SoloChallengeView];
    const before = JSON.stringify(sample.model.state);
    const { width, height } = config;
    root = new cc.Node('battle-feedback-isolated-qa');
    root.layer = cc.Layers.Enum.UI_2D;
    root.addComponent(cc.UITransform).setContentSize(width, height);
    root.addComponent(cc.BlockInputEvents);
    sample.view.root.addChild(root);
    ui.image(root, config.background, 0, 0, width, height);
    ui.box(root, 'qa-title', 0, config.titleY, width, 78, '#211C16ED', false);
    ui.text(root, config.title, 0, config.titleY, 31, '#FFE7B1', width);
    const stage = ui.text(root, '', 0, config.footerY, 23, '#FFE7B1', width);

    for (const [index, column] of config.columns.entries()) {
      const container = ui.node(root, 'qa-column-' + index, column.x, 0, width / 3, height);
      ui.text(container, column.label, 0, config.headerY, 26, '#FFE7B1', width / 3);
      const hp = [], host = { root: container, cc, ui, assets: sample.assets, config: sample.config,
        speed: 1, elapsed: 0, actors: new Map(), replay: { initial: [] } };
      const units = config.rows.map((row, i) => {
        const unit = { uid: i + 1, heroId: row.hero, star: 3, hp: row.hp, maxHp: config.maxHp, side: 'ally' };
        host.replay.initial.push(unit);
        const actor = ui.actor(container, unit, 0, row.y, config.modelScale);
        host.actors.set(unit.uid, actor);
        return actor;
      });
      host.ui = Object.create(ui);
      host.ui.health = (actor, value) => { hp.push(value); ui.health(actor, value); };
      hosts.push({ host, units, hp, apply: event => replayViews[index].prototype.apply.call(host, event) });
    }
    await waitFor(() => hosts.every(({units}) => units.every(actor => actor.sp.skeletonData)));
    for (const {host} of hosts) {
      if (hosts[0].host.nativeFrames) host.nativeFrames = hosts[0].host.nativeFrames;
      await native.warm(host);
    }
    for (const entry of hosts) {
      const {host, apply} = entry;
      apply({ type: 'status', target: 4, t: 0, effect: 'freeze', duration: 2 });
      apply({ type: 'status', target: 4, t: 0, effect: 'stun', duration: 2 });
      await Promise.resolve();
      if (host.controlStatuses?.size !== 2) throw Error('净化前缺少真实控制节点');
      effects.clear(host);
      // 控制重新放入真实状态入口，供下面的净化事件清理。
      apply({ type: 'status', target: 4, t: 0, effect: 'freeze', duration: 2 });
      apply({ type: 'status', target: 4, t: 0, effect: 'stun', duration: 2 });
      for (const child of [...host.root.children]) if (child.name.startsWith('combat-text-')) child.destroy();
      host.elapsed = .2;
      for (const [i, row] of config.rows.entries()) apply({ ...row.event, target: i + 1, t: host.elapsed });
    }

    /** 固定渲染时钟到指定相位，截图速度不影响动画位置。 */
    function seek(seconds) {
      for (const {host} of hosts) {
        host.speed = 0;
        for (const effect of host.nativeEffects) effect.elapsed = seconds;
        native.tick(host);
        for (const child of host.root.children) if (child.name.startsWith('combat-text-')) {
          cc.Tween.stopAllByTarget(child);
          cc.Tween.stopAllByTarget(child.getComponent(cc.UIOpacity));
        }
      }
    }

    await new Promise(resolve => setTimeout(resolve, config.readyMs));
    for (const [index, shot] of config.shots.entries()) {
      stage.string = shot.label;
      seek(shot.time);
      if (index === 0) for (const {host, hp} of hosts) {
        const active = host.nativeEffects.filter(e => !e.ended && e.node.isValid);
        const fx = config.rows.map(({ id }, i) =>
          active.some(e => e.id === id && e.owner === host.actors.get(i + 1) && e.sp.spriteFrame));
        const captions = host.root.children.filter(n => n.name.startsWith('combat-text-'))
          .map(n => n.getComponentInChildren(cc.Label)?.string);
        const valid = fx.every(Boolean) && config.rows.every(row => captions.includes(row.caption))
          && captions.length === config.rows.length && host.controlStatuses.size === 0
          && hp.length === 1 && hp[0] === config.rows[2].event.hp;
        report.samples.push({ mode: config.columns[report.samples.length].label, fx, captions, hp: [...hp], valid });
      }
      await capture(cc, index, shot.label);
    }

    for (const {host, units, apply} of hosts) {
      apply({ type: 'heal', t: 1, target: 3, amount: 0, hp: config.rows[2].event.hp });
      apply({ type: 'shield', t: 1, target: 1, amount: 0 });
      units[1].alive = false;
      apply({ type: 'evade', t: 1, target: 2 });
    }
    seek(1);
    report.expired = hosts.every(({host}) => !host.nativeEffects.length && host.nativeTimer === null
      && host.root.children.filter(n => n.name.startsWith('combat-text-')).length === config.rows.length);
    report.modelUnchanged = JSON.stringify(sample.model.state) === before;
    report.version = require('./app-version').version;
    report.phase = report.samples.every(s => s.valid) && report.expired && report.modelUnchanged ? 'passed' : 'failed';
  } catch (error) { report.phase = 'failed'; report.error = String(error.stack || error); }
  finally {
    for (const {host} of hosts) require('./battle-effects').clear(host);
    if (root?.isValid) root.destroy();
    save();
  }
}

module.exports = { start };
