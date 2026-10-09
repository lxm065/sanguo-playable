'use strict';
const c=require('./fortress-decoration-config').title;
/** 所有纸纹标题按面板实际高度定位，统一落在顶部纹理带内。 */
function draw(v,parent,text,width,height){const font=Math.min(c.maxFont,Math.max(c.minFont,height*c.fontRatio)),label=v.ui.text(parent,text,0,height*c.centerRatio,font,c.color,width-80,height*c.heightRatio);if(label){label.isBold=true;label.lineHeight=font;if(label.node?.addComponent){const outline=label.node.addComponent(v.cc.LabelOutline);outline.color=new v.cc.Color(c.outline);outline.width=c.outlineWidth;}}return label;}
module.exports={draw};
