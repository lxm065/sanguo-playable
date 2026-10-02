return {ready:sample.ready,denied:sample.denied,state:model.state,page:view.page,playing:view.playing,
 nodes:cc.director.getScene().getChildByName('Canvas').children.map(n=>({name:n.name,x:n.position.x,y:n.position.y})),
 skeletons:cc.director.getScene().getComponentsInChildren(cc.sp.Skeleton).map(s=>({name:s.skeletonData?.name,valid:!!s.skeletonData?.getRuntimeData()}))};
