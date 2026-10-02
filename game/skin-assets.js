'use strict';
/** 管理本地换皮资产；只返回表现资源，不读取或修改玩家数据。 */
function createAssets(cc, wxApi, config) {
  const cache=new Map(),fs=wxApi.getFileSystemManager();
  /** 读取包内 UTF-8 配置，缺失时显式抛错，不访问 CDN。 */
  function read(name){return fs.readFileSync(config.assetsRoot+name,'utf8');}
  /** 将包内图片载入固定缓存，引用计数保持到当前样板进程结束。 */
  function texture(name){
    const key='texture:'+name;
    if(!cache.has(key))cache.set(key,new Promise((resolve,reject)=>{
      cc.assetManager.loadRemote(config.assetsRoot+name,{ext:'.png'},(error,image)=>{
        if(error)return reject(error);
        const value=new cc.Texture2D();value.image=image;value.addRef();resolve(value);
      });
    }));
    return cache.get(key);
  }
  /** 生成可直接交给原 ResLoader 回调的 SpriteFrame。 */
  function sprite(name){
    const key='sprite:'+name;
    if(!cache.has(key))cache.set(key,texture(name).then(value=>{
      const frame=new cc.SpriteFrame();frame.name='sanguo:'+name;frame.texture=value;frame.addRef();return frame;
    }));
    return cache.get(key);
  }
  /** 装配由真实 MDX 动作渲染得到的 Spine 附件动画。 */
  function skeleton(){
    const key='skeleton';
    if(!cache.has(key))cache.set(key,(async function loadSkeleton(){
      const manifest=JSON.parse(read(config.hero.manifest));
      const textures=await Promise.all(manifest.textures.map(texture));
      const value=new cc.sp.SkeletonData();value.name='sanguo:zhaoyun';
      value.skeletonJson=JSON.parse(read(config.hero.skeleton));value.atlasText=read(config.hero.atlas);
      value.textures=textures;value.textureNames=manifest.textures;value.addRef();return value;
    })());
    return cache.get(key);
  }
  return {sprite,skeleton,texture,read};
}
module.exports={createAssets};
