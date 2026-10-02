'use strict';
/** 样板导航只切换已创建界面的可见性，不重发或伪造服务端协议。 */
function install(api,cc,state,config){
  const originalLayoutMap=api.MapPanel.prototype._layoutMap;
  const routes=config.navigation;
  let initialized=false,root=null,main=null,bar=null;
  /** 保留地图实例及回放位置，进入主页不会触发保存或投降。 */
  function show(view){
    if(!root?.isValid)return;
    const map=root.getChildByName('MapPanel');
    const embattle=root.getChildByName('EmbattlePanel');
    if(embattle?.activeInHierarchy)return;
    const battleVisible=view==='battle';
    if(map){
      const needsRestore=battleVisible&&!map.active;
      map.active=battleVisible;
      // MapLevel.onDisable 会清除交互状态，恢复时用同一份已录制地图重新布局。
      if(needsRestore)map.getComponent(api.MapPanel)._layoutMap();
    }
    if(!battleVisible)main._tabSelect(view==='hero'?routes.heroTab:routes.homeTab);
    state.view=view;
  }
  /** 创建位于游戏内容上沿的小型样板导航，所有动作只在当前副本内发生。 */
  function buildBar(){
    bar=new cc.Node('SampleNavigation');bar.layer=root.layer;root.addChild(bar);bar.setPosition(0,routes.y,0);
    bar.addComponent(cc.UITransform).setContentSize(routes.width,routes.height);
    const background=bar.addComponent(cc.Graphics);background.fillColor=new cc.Color(routes.color);background.roundRect(-routes.width/2,-routes.height/2,routes.width,routes.height,8);background.fill();
    routes.items.forEach((item,index)=>{
      const node=new cc.Node('sample-'+item.view);node.layer=root.layer;bar.addChild(node);node.setPosition((index-(routes.items.length-1)/2)*routes.itemWidth,0,0);
      node.addComponent(cc.UITransform).setContentSize(routes.itemWidth,routes.height);
      const label=node.addComponent(cc.Label);label.string=item.label;label.fontSize=routes.fontSize;label.lineHeight=routes.height;label.color=new cc.Color(routes.textColor);
      node.on(cc.Node.EventType.TOUCH_END,()=>show(item.view));
    });
    cc.director.on(cc.Director.EVENT_AFTER_UPDATE,()=>{if(bar?.isValid)bar.setSiblingIndex(root.children.length-1);});
  }
  /** 地图子节点 onLoad 与真实布局完成后才隐藏，避免提前失活打断原初始化。 */
  api.MapPanel.prototype._layoutMap=function layoutRecordedMap(){
    const result=originalLayoutMap.apply(this,arguments);
    if(!initialized){
      initialized=true;root=cc.director.getScene().getChildByName('Canvas');main=root.getComponent(api.MainScene);
      buildBar();state.navigate=show;show(routes.initialView);
    }
    return result;
  };
  const originalCity=api.MapCity.prototype.onBtnChapterClick;
  /** 首页已录制章节直接恢复现有地图，其他章节仍由原逻辑限制。 */
  api.MapCity.prototype.onBtnChapterClick=function openSampleChapter(){
    if(initialized&&this._chapterId===config.sample.chapterId)return show('battle');
    return originalCity.apply(this,arguments);
  };
  /** 本地只展示已录制主将，数值文案仍读取原配置，不生成未录制账号资料。 */
  api.JobPanel.prototype.onEnable=function enableSampleJob(){
    this._jobData={jobArr:[{...config.jobPreview,id:config.hero.jobId}]};
    this._curSelected=0;this.listJob.numItems=1;this.listJob.selectedId=0;
    this._setCurJobInfo(0);this.guide1.active=false;this.guide2.active=false;
    this.btnWatchVideo.active=false;this.btnBuy.active=false;this.btnFight.active=false;
  };
  state.navigation=routes;
}
module.exports={install};
