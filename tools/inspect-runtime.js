const scene=cc.director.getScene(),root=scene.getChildByName('Canvas');
return {errors:sample.errors,ready:sample.ready,roleJob:api.App.DataMgr.registerOrGet(api.RoleData).job,
 stack:api.App.UIMgr._UIStack.map(x=>({keys:Object.keys(x),uiId:x.uiId})),
 nodes:root.children.map(n=>({name:n.name,active:n.active})),
 main:root.getComponent(api.MainScene)?Object.keys(root.getComponent(api.MainScene)):null};
