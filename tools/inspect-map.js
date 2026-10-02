const root=cc.director.getScene().getChildByName('Canvas'),map=root.getChildByName('MapPanel');
/** 读取当前可交互节点的屏幕位置，辅助真实触控验收。 */
function scan(node){return {name:node.name,active:node.activeInHierarchy,position:node.worldPosition,components:node.components.map(c=>({type:cc.js.getClassName(c),keys:Object.keys(c).filter(k=>/data|floor|chapter|btn|list|cur|map/i.test(k)).map(k=>[k,typeof c[k]==='object'?c[k]?.constructor?.name:c[k]])})),children:node.children.map(scan)};}
return {map:scan(map),errors:sample.errors,events:sample.events};
