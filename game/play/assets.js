'use strict';
const {resolvePortraitFile}=require('./portraits');
/** 多武将资源仓库；所有图集和模型动画均来自包内文件。 */
class Assets{
 /** 缓存以资源键区分，不用单英雄全局槽覆盖其他武将。 */
 constructor(cc,wxApi,config){this.cc=cc;this.wx=wxApi;this.config=config;this.cache=new Map();}
 /** 从本地图片装配 Cocos 纹理并持有进程级引用。 */
 texture(file){file=resolvePortraitFile(file);const key='texture:'+file;if(!this.cache.has(key))this.cache.set(key,new Promise((resolve,reject)=>{this.cc.assetManager.loadRemote(this.config.assetsRoot+file,{ext:'.png'},(error,image)=>{if(error)return reject(error);const t=new this.cc.Texture2D();t.image=image;t.addRef();resolve(t);});}));return this.cache.get(key);}
 /** 背景与头像保留固定节点尺寸，避免原图分辨率影响布局。 */
 sprite(file){const key='sprite:'+file;if(!this.cache.has(key))this.cache.set(key,this.texture(file).then(texture=>{const frame=new this.cc.SpriteFrame();frame.texture=texture;frame.addRef();return frame;}));return this.cache.get(key);}
 /** 读取指定武将的 Spine 图集、动画和纹理，不包含网络回退。 */
 skeleton(hero){const key='skeleton:'+hero;if(!this.cache.has(key))this.cache.set(key,(async()=>{const fs=this.wx.getFileSystemManager(),read=file=>fs.readFileSync(this.config.assetsRoot+file,'utf8'),manifest=JSON.parse(read(hero+'-manifest.json')),data=new this.cc.sp.SkeletonData();data.name='sanguo:'+hero;data.skeletonJson=JSON.parse(read(hero+'.json'));data.atlasText=read(hero+'.atlas');data.textures=await Promise.all(manifest.textures.map(file=>this.texture(file)));data.textureNames=manifest.textures;data.addRef();if(!data.getRuntimeData())throw Error('无法解析武将动画 '+hero);return data;})());return this.cache.get(key);}
 /** 按资源配置判断是否具有已制作的战斗模型。 */
 hasModel(id){return require('./expedition-config').models.includes(id);}
 /** 只预载存在的骨骼，其余武将使用包内独立头像。 */
 async preload(roster){await Promise.all(roster.map(async h=>{if(this.hasModel(h.id))await this.skeleton(h.id);await this.sprite(h.id+'-avatar.png');}));await Promise.all([this.sprite(this.config.mapImage),this.sprite(this.config.battleImage)]);}
}
module.exports={Assets};
