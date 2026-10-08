"use strict";
const { resolvePortraitFile } = require("./portraits");
const {FrameQueue}=require('./frame-queue'),loading=require('./loading-config');
const appearance = require("./battle-appearance");
/** 多武将资源仓库；所有图集和模型动画均来自包内文件。 */
class Assets {
  /** 缓存以资源键区分，不用单英雄全局槽覆盖其他武将。 */
  constructor(cc, wxApi, config) {
    this.cc = cc;
    this.wx = wxApi;
    this.config = config;
    this.cache = new Map();
    this.assembly=new FrameQueue(loading.sliceDelay);
    this.metrics={loads:[],attachments:[]};
  }
  /** 从本地图片装配 Cocos 纹理并持有进程级引用。 */
  texture(file) {
    file = resolvePortraitFile(file);
    file = require("./release-config").assetAliases?.[file] || file;
    const key = "texture:" + file;
    if (!this.cache.has(key))
      this.cache.set(
        key,
        new Promise((resolve, reject) => {
          this.cc.assetManager.loadRemote(
            this.config.assetsRoot + file,
            { ext: file.endsWith(".jpg") ? ".jpg" : ".png" },
            (error, image) => {
              if (error) return reject(error);
              const t = new this.cc.Texture2D();
              t.image = image;
              t.addRef();
              resolve(t);
            },
          );
        }),
      );
    return this.cache.get(key);
  }
  /** 背景与头像保留固定节点尺寸，避免原图分辨率影响布局。 */
  sprite(file) {
    const key = "sprite:" + file;
    if (!this.cache.has(key))
      this.cache.set(
        key,
        this.texture(file).then((texture) => {
          const frame = new this.cc.SpriteFrame();
          frame.texture = texture;
          frame.addRef();
          return frame;
        }),
      );
    return this.cache.get(key);
  }
  /** 读取指定武将的 Spine 图集、动画和纹理，不包含网络回退。 */
  skeleton(hero, star = 1) {
    const selected = require("./appearance-policy").resolve(appearance, hero, star);
    const key = "skeleton:" + selected.assetKey;
    if (!this.cache.has(key))
      this.cache.set(
        key,
        (async () => {
          const fs = this.wx.getFileSystemManager(),
            read = (file) => new Promise((resolve,reject)=>fs.readFile({filePath:this.config.assetsRoot+file,encoding:"utf8",success:r=>resolve(r.data),fail:reject})),
            key = selected.assetKey,
            manifest = JSON.parse(await read(key + "-manifest.json")),
            data = new this.cc.sp.SkeletonData();
          data.name = "sanguo:" + hero;
          data.skeletonJson = JSON.parse(await read(key + ".json"));
          if (selected.animationKey) data.skeletonJson.animations = JSON.parse(await read(selected.animationKey + ".json")).animations;
          data.atlasText = await read(key + ".atlas");
          data.textures = await Promise.all(
            manifest.textures.map((file) => this.texture(file)),
          );
          data.textureNames = manifest.textures;
          data.battleManifest = manifest;
          data.addRef();
          await this.assembly.run(()=>{const start=Date.now();if (!data.getRuntimeData()) throw Error("无法解析武将动画 " + hero);this.metrics.loads.push({hero,ms:Date.now()-start});});
          return data;
        })(),
      );
    return this.cache.get(key).catch(error=>{this.cache.delete(key);throw error;});
  }
  /** 按资源配置判断是否具有已制作的战斗模型。 */
  hasModel(id) {
    return !!(appearance.models[id] || appearance.legacy[id]);
  }
  /** 启动只预载轻量头像，战场模型按出现的武将懒加载，避免一次占满纹理内存。 */
  async preload(roster) {
    await Promise.all(
      roster.map(async (h) => {
        await this.sprite(h.id + "-avatar.png");
      }),
    );
    await Promise.all([
      this.sprite(this.config.mapImage),
      this.sprite(this.config.battleImage),
    ]);
  }
}
module.exports = { Assets };
