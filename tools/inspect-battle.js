const root=cc.director.getScene().getChildByName('Canvas');
const characters=root.getComponentsInChildren(api.Character);
return {errors:sample.errors,events:sample.events,trace:sample.validationTrace,
 characters:characters.map(c=>({active:c.node.activeInHierarchy,selected:c.model.__sanguoSelected,
  id:c._heroData?.heroId,camp:c._heroData?.camp,briefId:c._gridData?.brief?.id,
  model:c.model._curModelId,skeleton:c.model._skeAnim?.skeletonData?.name,state:c.model._curAniName,
  hp:c._heroData?.hp,maxHp:c._heroData?.maxHp})),
 nodes:root.children.map(n=>({name:n.name,active:n.active})),
 labels:root.getComponentsInChildren(cc.Label).filter(l=>l.node.activeInHierarchy).map(l=>l.string)};
