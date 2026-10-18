'use strict';
const c=require('./activity-config').talent.icon;
/** 将原插画裁入圆框内孔，名称和等级留在遮罩外，避免方形底色盖住金属边缘。 */
function draw(v,parent,file,size){
 const u=v.ui,diameter=size*c.diameterScale;
 u.image(parent,c.frame,0,0,size+c.framePadding,size+c.framePadding);
 const clip=u.node(parent,'talent-icon-clip',0,0,diameter,diameter);
 const mask=clip.addComponent(v.cc.Mask);mask.type=v.cc.Mask.Type.ELLIPSE;mask.segments=c.maskSegments;
 u.image(clip,file,0,0,diameter*c.artScale,diameter*c.artScale);
 return clip;
}
module.exports={draw};
