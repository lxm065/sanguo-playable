return sample.assets.skeleton().then(data=>{
 const root=cc.director.getScene().getChildByName('Canvas');
 const panel=new cc.Node('AcceptanceAnimationGallery');panel.layer=root.layer;root.addChild(panel);
 panel.addComponent(cc.UITransform).setContentSize(720,1280);
 const g=panel.addComponent(cc.Graphics);g.fillColor=new cc.Color('#302A26');g.rect(-360,-640,720,1280);g.fill();
 /** 创建验收文字，避免与图形组件共用渲染节点。 */
 function label(text,x,y,size){const node=new cc.Node('caption');node.layer=panel.layer;panel.addChild(node);node.setPosition(x,y);node.addComponent(cc.UITransform);const l=node.addComponent(cc.Label);l.string=text;l.fontSize=size;l.lineHeight=size+10;l.color=new cc.Color('#E7D1A6');}
 label('赵云 · 原引擎动画验收',0,560,36);
 const names=[['idle','待机'],['skill1','攻击'],['hit','受击动作'],['dead','死亡动作']];
 names.forEach(([animation,caption],i)=>{const x=i%2?175:-175,y=i<2?180:-280;
  const node=new cc.Node(animation);node.layer=panel.layer;panel.addChild(node);node.setPosition(x,y);node.setScale(1.6,1.6,1);
  const skeleton=node.addComponent(cc.sp.Skeleton);skeleton.skeletonData=data;skeleton.setAnimation(0,animation,animation!=='dead');
  label(caption,x,y-70,30);
 });
 label('死亡单独验收；首战赵云生存\n仅展示资源，不修改战报与技能',0,-560,25);
 return {animations:names.map(x=>x[0]),runtimeParsed:!!data.getRuntimeData(),errors:sample.errors};
});
