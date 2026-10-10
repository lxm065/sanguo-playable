'use strict';
const c={image:require('./home-march-config').markers.complete,size:52};
/** 领取状态共享远征勾选素材，不创建可再次领取的按钮。 */
function draw(v,parent,x,y,size=c.size){return v.ui.image(parent,c.image,x,y,size,size);}
module.exports={draw,config:c};
