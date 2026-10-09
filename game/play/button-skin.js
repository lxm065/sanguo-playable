'use strict';
const c=require('./button-skin-config');
/** 图片皮肤与图文排版共用入口，调用方继续传原按钮颜色以选择语义样式。 */
function draw(ui,node,text,color,w,h){ui.image(node,c.files[c.colors[String(color).toUpperCase()]||c.defaultSkin],0,0,w,h);return require('./button-content').draw(ui,node,text,c.font,c.text,w-c.inset,h-c.inset/2);}
module.exports={draw};
