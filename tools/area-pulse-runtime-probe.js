'use strict';

/** 通过正式模拟器生成样本，保留技能中心、目标、时刻和实际伤害。 */
function sampleBattle(config) {
  const roster = require('./expedition-roster').map(hero => ({ ...hero,
    tiers: hero.tiers?.map(tier => ({ ...tier, hp: config.hp, attack: config.attack })) }));
  const rules = { ...require('./config'), overtime: { enabled: false }, maxBattleSeconds: config.battleSeconds };
  return require('./expedition-combat').simulate(config.allies, config.enemies, roster, rules, config.seed, 1);
}

/** 离线验收只回放两个技能片段，远征与两种挑战使用各自的实际入口。 */
async function start(api, runID, config) {
  const fs = api.getFileSystemManager(), base = api.env.USER_DATA_PATH + '/quiet-' + runID;
  const report = { runID, phase: 'waiting-ready', screens: [], samples: [] };
  let root, hosts = [];

  /** 保存本次验收进度和截图索引。 */
  function save() { fs.writeFileSync(base + '.json', JSON.stringify(report, null, 2), 'utf8'); }

  /** 有界等待引擎、武将模型和官方截图。 */
  async function until(check) {
    const deadline = Date.now() + config.waitMs;
    while (!check()) {
      if (Date.now() >= deadline) throw Error('范围技能验收等待超时');
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /** 让开发者工具在引擎完成绘制后截取帧。 */
  async function capture(cc, index, name) {
    await new Promise(resolve => cc.director.once(cc.Director.EVENT_AFTER_DRAW, resolve));
    report.phase = 'capture-ready'; report.captureIndex = index; save();
    await until(() => {
      try { fs.accessSync(base + '-capture-' + index + '.ack'); return true; }
      catch { return false; }
    });
    report.screens.push({ name, file: 'frame-' + String(index).padStart(3, '0') + '.jpg' });
  }

  save();
  try {
    await until(() => globalThis.__sanguoPlay?.ready);
    const sample = globalThis.__sanguoPlay, { cc } = sample, { ui } = sample.view;
    const effects = require('./battle-effects'), native = require('./native-effects'), storm = require('./blizzard-view');
    const modes = [require('./expedition-view').ExpeditionView, require('./challenge-view').ChallengeView,
      require('./solo-challenge-view').SoloChallengeView];
    const battle = sampleBattle(config);
    const cast = battle.events.find(e => e.type === 'ability' && e.effect === 'blizzard');
    const firstSnow = battle.events.find(e => e.type === 'damage' && e.effect === 'blizzard');
    const snowHits = battle.events.filter(e => e.type === 'damage' && e.effect === 'blizzard' && e.t === firstSnow.t);
    const roarStatus = battle.events.find(e => e.type === 'status' && e.effect === 'rot');
    const roarHit = battle.events.find(e => e.type === 'damage' && e.effect === 'rot');
    if (!cast?.area || snowHits.length < 2 || !roarHit || !roarStatus) throw Error('没有生成预期的真实技能事件');
    report.events = { cast, snowHits, roarHit };
    const before = JSON.stringify(sample.model.state), { width, height } = config;
    root = new cc.Node('area-pulse-isolated-qa');
    root.layer = cc.Layers.Enum.UI_2D;
    root.addComponent(cc.UITransform).setContentSize(width, height);
    root.addComponent(cc.BlockInputEvents);
    sample.view.root.addChild(root);
    ui.image(root, config.background, 0, 0, width, height);
    ui.box(root, 'qa-title', 0, config.titleY, width, 78, '#211C16ED', false);
    ui.text(root, config.title, 0, config.titleY, 31, '#FFE7B1', width);
    ui.text(root, config.snowTitle, 0, config.snowY, 28, '#D9F7FF', width);
    ui.text(root, config.upgradeTitle, 0, config.upgradeY, 28, '#FFE7AC', width);
    const stage = ui.text(root, '', 0, config.footerY, 23, '#FFE7B1', width);

    /** 布置展示镜头，使用真实模型和正式 apply，不触发奖励或存档。 */
    function scene(mode, layout) {
      const container = ui.node(root, layout.name, 0, 0, width, height);
      const host = { root: container, cc, ui, assets: sample.assets, config: sample.config, model: sample.model,
        speed: 1, elapsed: 0, actors: new Map(), replay: battle, nativeFrames: hosts[0]?.nativeFrames };
      host.position = (x, y) => ({ x: layout.centerX + (x - cast.area.x) * layout.cellX,
        y: layout.centerY + (y - cast.area.y) * layout.cellY });
      host.apply = event => mode.prototype.apply.call(host, event);
      host.damageText = () => {};
      for (const { uid, dx, dy } of layout.actors) {
        const unit = battle.initial.find(u => u.uid === uid);
        host.actors.set(uid, ui.actor(container, unit, layout.centerX + dx, layout.centerY + dy, layout.scale));
      }
      hosts.push(host);
      return host;
    }

    /** 固定原生播放器的回放相位，便于对照特效形态。 */
    function seek(host, seconds) {
      host.speed = 0;
      for (const effect of host.nativeEffects || []) effect.elapsed = seconds;
      native.tick(host);
    }

    /** 读取指定动画的有效实例数量。 */
    function count(host, id) { return (host.nativeEffects || []).filter(e => e.id === id && !e.ended && e.node.isValid).length; }

    for (const [index, mode] of modes.entries()) {
      const snow = scene(mode, config.snow), tiger = scene(mode, config.tiger);
      await native.warm(snow);
      tiger.nativeFrames = snow.nativeFrames;
      await until(() => [snow, tiger].every(host => [...host.actors.values()].every(actor => actor.sp.skeletonData)));
      snow.elapsed = cast.t;
      const beforeCast = snow.root.children.length;
      snow.apply(cast);
      tiger.apply(roarStatus);
      const state = snow.blizzardCasts?.get(cast.uid), point = snow.position(cast.area.x, cast.area.y);
      const clearGround = snow.root.children.length === beforeCast && state?.x === point.x && state?.y === point.y
        && count(snow, 'pixelBlizzardWave') === 0;
      if (index === 0) {
        stage.string = config.castCaption;
        await capture(cc, 0, config.castCaption);
      }
      snow.elapsed = firstSnow.t;
      for (const event of snowHits) snow.apply(event);
      tiger.elapsed = roarHit.t;
      tiger.apply(roarHit);
      await new Promise(resolve => setTimeout(resolve, config.readyMs));
      seek(snow, config.samplePhase); seek(tiger, config.samplePhase);
      const oneWave = count(snow, 'pixelBlizzardWave') === 1 && count(tiger, 'pixelTigerRoar') === 1
        && [snow, tiger].every(host => host.nativeEffects.some(e => e.node.active && e.sp.spriteFrame));
      for (const effect of tiger.nativeEffects) native.stop(tiger, effect.node);
      const hero = tiger.actors.get(roarHit.actor);
      tiger.speed = 1;
      require('./upgrade-effects').show(tiger, new Map([[hero.unit.uid, hero.unit.star - 1]]), [hero.unit]);
      await Promise.resolve();
      seek(tiger, config.upgradePhase);
      const layer = hero.node.getChildByName('upgrade-feedback-hero');
      const label = layer?.getComponentInChildren(cc.Label);
      if (label) {
        cc.Tween.stopAllByTarget(label.node);
        cc.Tween.stopAllByTarget(label.node.getComponent(cc.UIOpacity));
      }
      const upgrade = tiger.nativeEffects.some(e => e.id === 'levelup' && e.node.parent === layer
        && e.node.active && e.sp.spriteFrame) && label?.string === config.upgradeText;
      if (index === 0) {
        stage.string = config.hitCaption;
        await capture(cc, 1, config.hitCaption);
      }
      snow.apply({ type: 'channelInterrupted', t: firstSnow.t + config.samplePhase, uid: cast.uid });
      await new Promise(resolve => cc.director.once(cc.Director.EVENT_AFTER_DRAW, resolve));
      const removed = !snow.blizzardCasts.size && count(snow, 'pixelBlizzardWave') === 0;
      for (const host of [snow, tiger]) { storm.update(host); effects.clear(host); host.root.destroy(); }
      report.samples.push({ mode: config.modes[index], clearGround, oneWave, removed, upgrade,
        valid: clearGround && oneWave && removed && upgrade });
    }
    report.modelUnchanged = JSON.stringify(sample.model.state) === before;
    report.version = require('./app-version').version;
    report.phase = report.modelUnchanged && report.samples.every(s => s.valid) ? 'passed' : 'failed';
  } catch (error) { report.phase = 'failed'; report.error = String(error.stack || error); }
  finally {
    for (const host of hosts) require('./battle-effects').clear(host);
    if (root?.isValid) root.destroy();
    save();
  }
}

module.exports = { start };
