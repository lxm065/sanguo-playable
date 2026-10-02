const config = require('./offline-preview.config');

/** 通过注入的游戏接口建立本地预览入口，不创建线上会话。 */
function install(api) {
  if (!config.enabled || !config.allowedPlatforms.includes(api.platform)) return;
  const { App, RoleData, PlayerData, LoginData, BattleData, GameEvents } = api;
  const seen = new Set();

  /** 初始化主界面使用的最小本地角色数据，不伪造线上登录结果。 */
  function seed() {
    Object.assign(App.DataMgr.registerOrGet(RoleData), {
      roleUin: config.roleUin, nickname: config.nickname, hasRole: true,
      job: config.job, createTsp: Math.floor(Date.now() / 1000),
    });
    Object.assign(App.DataMgr.registerOrGet(PlayerData), {
      username: config.username, inviteUin: '',
    });
    App.LocalStorageMgr.setBool('FIRST_EXIT_FLAG_' + config.username, true);
    Object.assign(App.DataMgr.registerOrGet(LoginData), {
      isFirstLogin: false, firstLogin: false, loginTsp: Math.floor(Date.now() / 1000),
    });
    App.TimeUtils.initSeverTime(Math.floor(Date.now() / 1000));
    const battle = App.DataMgr.registerOrGet(BattleData);
    Object.assign(battle.curChapter, config.chapter);
    Object.assign(battle.maxChapter, config.chapter);
    battle.previewChapter = config.previewChapter;
  }

  /** 仅本地读取使用事件刷新；不支持的服务器请求明确失败。 */
  function send(channel, command) {
    if (command === api.NetCommand.GAME_GET_ROLE_DATA_REQ) {
      setTimeout(function notifyRole() { App.EventMgr.emitEvent(GameEvents.ON_ROLE_INFO_UPDATE); }, 0);
      return true;
    }
    if (command === api.NetCommand.GAME_GET_FIGHT_INFO_REQ) {
      setTimeout(function notifyChapter() {
        App.EventMgr.emitEvent(GameEvents.ON_GET_EXPEDITION_INFO, config.chapter.chapter);
      }, 0);
      return true;
    }
    if (!seen.has(command)) {
      seen.add(command);
      console.info('[offline-preview] unsupported request', command);
      App.ToastMgr.show(config.unavailableText);
    }
    return false;
  }

  /** 离线模式统一拦截游戏协议出口，避免本地预览数据发往真实服务器。 */
  for (const method of ['send', 'request', 'requestUnique']) api.SenderBase.prototype[method] = send;

  /** 离线运行时不启动心跳或重连计时器。 */
  function stopOfflineHeartbeat() { this._stopHeartBeat(); }
  for (const method of ['_checkNetState', '_startHeartBeat', '_resetReceiveMsgTimer', '_resetHearbeatTimer']) {
    api.HeartBeat.prototype[method] = stopOfflineHeartbeat;
  }

  /** 从原登录场景进入本地主界面。 */
  function enter() {
    this.unscheduleAllCallbacks();
    seed();
    console.info('[offline-preview] entering main scene');
    App.SceneMgr.switchSceneDirectly(api.GameScene.SCENE_MAIN);
  }

  /** 替换登录场景启动钩子，保留配置控制的手动入口。 */
  api.LoginScene.prototype.start = function startOfflinePreview() {
    this.editboxUsername.node.active = false;
    this.toggleProtocol.node.active = false;
    this.richTextProtocol.string = '';
    this.btnStart.active = true;
    this.btnStart.getChildByName('label_start').getComponent(api.Label).string = config.buttonText;
    if (config.autoEnter) enter.call(this);
  };
  api.LoginScene.prototype.onBtnStartClick = enter;
  if (api.MainScene) require('./offline-campaign-view').install(api);
  console.info('[offline-preview] enabled');
}

module.exports = { install };
