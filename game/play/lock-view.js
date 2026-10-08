'use strict';
const config={file:'common/lock.png',size:80,portraitRatio:.82};
/** 所有锁定入口复用同一张透明锁头；尺寸由调用界面布局提供。 */
function show(view,parent,x=0,y=0,size=config.size){const n=view.ui.image(parent,config.file,x,y,size,size);n.name='locked-icon';return n;}
module.exports={config,show};
