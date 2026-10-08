'use strict';
/** 区分轻点抖动与拖动；一次触摸越过阈值后直到下次按下均不再视为点击。 */
function bindScroll(cc,viewport,content,options){
 let start=null,base=0,dragged=false;
 viewport.on(cc.Node.EventType.TOUCH_START,e=>{const p=e.getUILocation();start={x:p.x,y:p.y};base=content.position.y;dragged=false;options.onDrag(false);});
 viewport.on(cc.Node.EventType.TOUCH_MOVE,e=>{
  if(!start)return;
  const p=e.getUILocation(),dx=p.x-start.x,dy=p.y-start.y;
  if(!dragged&&Math.hypot(dx,dy)<options.threshold)return;
  dragged=true;options.onDrag(true);
  const value=Math.max(options.min,Math.min(options.max,base+dy));
  content.setPosition(0,value);options.onOffset(value);
 });
 viewport.on(cc.Node.EventType.TOUCH_END,()=>{start=null;});
 viewport.on(cc.Node.EventType.TOUCH_CANCEL,()=>{start=null;dragged=true;options.onDrag(true);});
}
module.exports={bindScroll};
