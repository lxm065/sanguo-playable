/** 独立离线启动：仅初始化本地引擎和内置资源，不执行原联网业务。 */
async function boot() {
  if (require('./offline-rules').strictOffline) {
    for (const method of ['request', 'downloadFile', 'connectSocket']) {
      const original = wx[method];
      /** 离线入口禁止外网请求；包内路径和微信本地文件不受影响。 */
      wx[method] = function rejectRemote(options) {
        const url = String(options && options.url || '');
        if (/^(https?|wss?):\/\//i.test(url) && !/^http:\/\/usr\//i.test(url)) {
          throw new Error('[offline-campaign] 禁止联网: ' + method + ' ' + url);
        }
        return original.call(wx, options);
      };
    }
  }
  globalThis.__wxRequire = require;
  require('./web-adapter');
  require('./src/polyfills.bundle.43263.js');
  require('./src/system.bundle.f45da.js');
  const importMap = require('./src/import-map.c87de.js').default;
  System.warmup({ importMap, importMapUrl: 'src/import-map.c87de.js',
    /** 将引擎模块解析到项目内的真实文件。 */
    defaultHandler(url) { require('.' + url); },
    handlers: {
      /** 内置资源脚本保持原本地模块路径。 */
      'project:'(url) { require(url); },
    },
  });
  const cc = await System.import('cc');
  require('./engine-adapter');
  await cc.game.init({ debugMode: cc.DebugMode.ERROR, settingsPath: 'src/offline-settings.json' });
  cc.game.run(function startOfflineScene() {
    const scene = new cc.Scene('OfflineCampaignScene');
    const canvasNode = new cc.Node('Canvas');
    canvasNode.layer = cc.Layers.Enum.UI_2D;
    canvasNode.addComponent(cc.UITransform).setContentSize(720, 1280);
    canvasNode.setPosition(360, 640, 0);
    const canvasComponent = canvasNode.addComponent(cc.Canvas);
    const cameraNode = new cc.Node('OfflineCamera');
    cameraNode.setPosition(360, 640, 1000);
    const camera = cameraNode.addComponent(cc.Camera);
    camera.projection = cc.Camera.ProjectionType.ORTHO;
    camera.orthoHeight = 640;
    camera.near = 0.1;
    camera.far = 2000;
    camera.visibility = cc.Layers.Enum.UI_2D;
    camera.clearFlags = cc.Camera.ClearFlag.SOLID_COLOR;
    camera.clearColor = new cc.Color('#192A30');
    canvasComponent.cameraComponent = camera;
    scene.addChild(cameraNode);
    scene.addChild(canvasNode);
    cc.director.runSceneImmediate(scene);
    const files = require('./offline-assets');
    const { CampaignView } = require('./offline-campaign-view');
    const screen = new CampaignView({ standalone: true, roster: require('./offline-heroes'),
      /** 复用已经完成初始化的引擎实例。 */
      loadEngine() { return Promise.resolve(cc); },
      /** 从包内图片构造头像，不调用 CDN。 */
      loadPortrait(icon, callback) {
        const path = files[icon];
        if (!path) { callback(new Error('缺少本地头像 ' + icon)); return; }
        cc.assetManager.loadRemote(path, (error, image) => {
          if (error) { callback(error); return; }
          const texture = new cc.Texture2D();
          texture.image = image;
          const frame = new cc.SpriteFrame();
          frame.texture = texture;
          callback(null, frame);
        });
      },
    });
    screen.open().catch(reportError);
    console.info('[offline-campaign] local bootstrap; remote resources disabled');
  });
}

/** 启动异常明确显示，避免静默黑屏。 */
function reportError(error) {
  console.error('[offline-campaign] startup failed', error);
  wx.showModal({ title: '本地远征启动失败', content: error.message || String(error), showCancel: false });
}

boot().catch(reportError);
