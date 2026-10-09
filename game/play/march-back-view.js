'use strict';
const c=require('./button-skin-config').back;
/** 图标返回保留独立触摸区域，只打开原退出弹窗，不直接退出或丢弃棋局。 */
function render(v){const n=v.ui.node(v.root,'march-back',c.x,c.y,c.width,c.height);v.ui.image(n,c.icon,0,0,c.iconSize,c.iconSize);n.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;require('./march-exit-view').show(v);});return n;}
module.exports={render};
