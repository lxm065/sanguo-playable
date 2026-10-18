'use strict';
const c=require('./home-region-config').viewport;
/** 全屏地图和节点共用拖动层，边缘镜像延展连续纹理；固定功能按钮置于上层。 */
function create(v,parent,region,active,page){const u=v.ui,cc=v.cc,viewport=u.node(parent,'home-map-viewport',0,c.y,c.width,c.height);viewport.addComponent(cc.Mask);viewport.setSiblingIndex(0);const key=page+':'+v.progress.state.chapter;v.homeMapOffsets??={};const offset=v.homeMapOffsets[key]??Math.max(c.min,Math.min(c.max,-(active?.y||0)));const content=u.node(viewport,'home-map-content',0,offset,c.mapWidth,c.mapHeight);for(const tile of c.tileOffsets){const image=u.image(content,region.file,0,tile*c.mapHeight,c.mapWidth,c.mapHeight);if(tile%2)image.setScale(1,-1,1);}v.homeMapDragged=false;require('./scroll-gesture').bindScroll(cc,viewport,content,{min:c.min,max:c.max,threshold:c.dragThreshold,onOffset:value=>v.homeMapOffsets[key]=value,onDrag:value=>v.homeMapDragged=value});return content;}
module.exports={create};
