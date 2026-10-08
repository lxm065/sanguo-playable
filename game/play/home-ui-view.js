'use strict';
const c=require('./home-ui-config');
/** 等比显示入口图标，按资源配置选择裁剪，保持原点击区域、标签和红点。 */
function icon(v,parent,key,w,h){const item=c.icons[key];if(!item)return v.ui.image(parent,'classic/'+key+'.png',0,c.offsetY,w,h);const d=Math.min(w,h)*c.diameterScale,n=v.ui.node(parent,'home-badge-'+key,0,c.offsetY,d,d);if(item.circle){const mask=n.addComponent(v.cc.Mask);mask.type=v.cc.Mask.Type.ELLIPSE;mask.segments=c.maskSegments;}return v.ui.image(n,item.file,0,0,d,d);}
module.exports={icon};
