'use strict';
const config=require('./skin.config');
const {createAssets}=require('./skin-assets');

/** 在游戏类定义完成后安装表现适配器；原配置、协议和战报仍由原模块负责。 */
function install(api){
  globalThis.__sanguo={api,config,ready:false,events:[],errors:[]};
  if(!config.allowedPlatforms.includes(wx.getSystemInfoSync().platform))return;
  const {App,HeroModel,Character,MainScene,JobPanel,MapChapter,HeroAniStateEnum}=api;
  api.loadEngine().then(function attach(cc){
    const assets=createAssets(cc,wx,config),state=globalThis.__sanguo;
    state.cc=cc;state.assets=assets;
    require('./sample-navigation').install(api,cc,state,config);
    if(!config.enabled){state.ready=true;return;}
    const spriteProperty=Object.getOwnPropertyDescriptor(cc.Sprite.prototype,'spriteFrame');
    /** 换皮图片沿用原节点尺寸，避免高分辨率头像撑大布局。 */
    Object.defineProperty(cc.Sprite.prototype,'spriteFrame',{...spriteProperty,set:function setSkinFrame(frame){
      const themed=frame?.name?.startsWith('sanguo:');
      const transform=themed&&this.node?.getComponent(cc.UITransform),width=transform?.width,height=transform?.height;
      if(themed)this.sizeMode=cc.Sprite.SizeMode.CUSTOM;
      spriteProperty.set.call(this,frame);
      if(transform)transform.setContentSize(width,height);
    }});
    /** 记录资源或适配失败；不吞掉原玩法错误。 */
    function fail(error){state.errors.push(String(error?.stack||error));console.error('[sanguo-skin]',error);}
    /** 只对配置声明的表现资源做映射，其他请求完整转发原加载器。 */
    const originalLoad=App.ResLoader.loadRes;
    App.ResLoader.loadRes=function loadThemedResource(bundle,resource,type,progress,complete){
      const file=typeof resource==='string'&&config.resourceOverrides[bundle+':'+resource];
      if(!file)return originalLoad.apply(this,arguments);
      const done=typeof complete==='function'?complete:typeof progress==='function'?progress:null;
      assets.sprite(file).then(frame=>{if(done)done(null,frame);},error=>{fail(error);if(done)done(error);});
    };
    /** 清除跨外观复用的缓存，并使旧异步资源失效。 */
    function selectAppearance(model,selected){
      if(!!model.__sanguoSelected!==!!selected){model.__sanguoRequest=(model.__sanguoRequest||0)+1;model._removeModel();}
      model.__sanguoSelected=!!selected;
    }
    /** 根据角色所属与模型匹配换皮，敌方及变形角色保持原实现。 */
    function markCharacter(instance,fight){
      const data=fight?instance._heroData:instance._gridData?.brief;
      const match=data&&(fight?data.camp===config.hero.camp&&data.heroId===config.hero.heroId&&data.modelData?.model===config.hero.modelId:(data.heroId??data.id)===config.hero.heroId&&data.modelId===config.hero.modelId);
      selectAppearance(instance.model,match);
    }
    for(const [method,fight] of [['initFight',true],['initEmbattle',false]]){
      const original=Character.prototype[method];
      /** 原函数执行前只设置表现标记，不更改 heroData/gridData。 */
      Character.prototype[method]=function initThemedCharacter(){markCharacter(this,fight);return original.apply(this,arguments);};
    }
    const originalBag=api.BagHero.prototype.init;
    /** 背包与布阵沿用同一角色映射，防止进入战斗才突然换外观。 */
    api.BagHero.prototype.init=function initThemedBag(data){
      selectAppearance(this.model,(data.heroId??data.id)===config.hero.heroId&&data.modelId===config.hero.modelId);
      return originalBag.apply(this,arguments);
    };
    const originalModel=HeroModel.prototype._loadModel;
    /** 将同一套 Spine 状态机接到赵云序列资源，完成回调仍回到原 idle。 */
    HeroModel.prototype._loadModel=function loadThemedModel(id,initial,scale,color,material){
      if(!this.__sanguoSelected||id!==config.hero.modelId)return originalModel.apply(this,arguments);
      const owner=this,request=(this.__sanguoRequest||0)+1;this.__sanguoRequest=request;
      assets.skeleton().then(data=>{
        if(!owner.isValid||!owner._skeAnim?.isValid||owner.__sanguoRequest!==request)return;
        owner.addAutoReleaseRes(data);owner._curModelId=id;owner._skeAnim.skeletonData=data;owner.setAlpha(255);owner.setScale(scale);owner.setColor(color);owner.switchMaterial(material);
        owner._skeAnim.setCompleteListener(entry=>{owner._curAniName='';owner._heroState=HeroAniStateEnum.NONE;if(entry.animation.name!=='dead')owner.switchHeroState(HeroAniStateEnum.IDLE);});
        owner.switchHeroState(initial);state.events.push({type:'hero-ready',model:id});
      }).catch(fail);
    };
    const originalReset=HeroModel.prototype.reset;
    /** 清理池化角色的异步请求，避免晚到资源覆盖复用后的敌军。 */
    HeroModel.prototype.reset=function resetThemedModel(){this.__sanguoRequest=(this.__sanguoRequest||0)+1;return originalReset.apply(this,arguments);};
    const originalJob=JobPanel.prototype._setCurJobInfo;
    /** 更换首个主将的展示名与简介，保留生命、金币和技能真实描述。 */
    JobPanel.prototype._setCurJobInfo=function setThemedJob(index){
      const result=originalJob.apply(this,arguments);const job=this._jobData.jobArr[index];
      if(job?.id===config.hero.jobId){this.lblJobName.string=config.hero.name;this.lblJobDesc.string=config.hero.description;}
      return result;
    };
    /** 只包装配置查询的展示字段；返回副本，避免污染原始数值表。 */
    const originalChapter=App.ConfigMgr.getChapterInfoById;
    App.ConfigMgr.getChapterInfoById=function chapterAppearance(id){const value=originalChapter.apply(this,arguments);if(!value||!config.sample.cityNames[id])return value;return {...value,page_name:'1.'+config.sample.chapterName,chapter_des:config.sample.cityNames[id]};};
    const originalWords=App.ConfigMgr.getWordsById;
    App.ConfigMgr.getWordsById=function themedWords(){const text=originalWords.apply(this,arguments);return config.words[text]||text;};
    const originalHero=App.ConfigMgr.getHeroInfoById;
    /** 只替换武将展示名，技能、属性、模型 ID 和养成关系保留原表。 */
    App.ConfigMgr.getHeroInfoById=function themedHeroInfo(id){const value=originalHero.apply(this,arguments);return value&&Number(id)===config.hero.heroId?{...value,name:config.hero.name}:value;};
    const originalMap=MapChapter.prototype.setMapChapterData;
    /** 首页保留城市交互节点，用行军地图替代对应页的地形贴片。 */
    MapChapter.prototype.setMapChapterData=function setThemedMap(page){
      const result=originalMap.apply(this,arguments);
      if(page===0){
        this.contentGround.active=false;const background=this.node.getChildByName('background')?.getComponent(cc.Sprite);
        if(background)assets.sprite(config.sample.map).then(frame=>{if(background.isValid)background.spriteFrame=frame;}).catch(fail);
      }
      return result;
    };
    const originalMain=MainScene.prototype.onLoad;
    /** 用原按钮节点承载三国徽记，点击区域、红点与标签继续由原界面管理。 */
    MainScene.prototype.onLoad=function loadThemedHome(){
      const result=originalMain.apply(this,arguments);
      this.nodeTab.children.forEach((tab,index)=>{
        const glyph=config.theme.tabSymbols[index];if(!glyph)return;
        const sprite=tab.getComponent(cc.Sprite);if(sprite)sprite.enabled=false;
        const badge=new cc.Node('SanguoTabBadge');badge.layer=tab.layer;tab.addChild(badge);badge.setSiblingIndex(0);badge.setPosition(0,config.theme.tabIconY,0);
        badge.addComponent(cc.UITransform).setContentSize(100,86);
        const graphics=badge.addComponent(cc.Graphics);graphics.fillColor=new cc.Color(config.theme.vermilion);graphics.strokeColor=new cc.Color(config.theme.gold);graphics.lineWidth=3;
        graphics.roundRect(-39,-28,78,65,10);graphics.fill();graphics.stroke();
        const text=new cc.Node('glyph');text.layer=badge.layer;badge.addChild(text);text.addComponent(cc.UITransform);
        const label=text.addComponent(cc.Label);label.string=glyph;label.fontSize=43;label.lineHeight=53;label.color=new cc.Color(config.theme.paper);
      });
      return result;
    };
    state.ready=true;state.assets=assets;
    assets.skeleton().catch(fail);
    console.info('[sanguo-skin] ready',config.themeId);
  }).catch(error=>{globalThis.__sanguo.errors.push(String(error));console.error('[sanguo-skin]',error);});
}
module.exports={install};
