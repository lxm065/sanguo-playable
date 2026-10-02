const main=cc.director.getScene().getChildByName('Canvas').getComponent(api.MainScene);
return {mainMethods:Object.getOwnPropertyNames(api.MainScene.prototype),curTab:main._curTab,tabs:main._mainTabData.tabArr.map(t=>({tab:t.tabEnum,bundle:t.bundle,path:t.path})),
 mapMethods:Object.getOwnPropertyNames(api.App.UIMgr._UIStack[0].uiBase.constructor.prototype)};
