'use strict';
const c=require('./equipment-swipe-config');
/** 方向阈值共用，单页时仍保留原有拖动穿戴能力。 */
function intent(start,p,pages){const dx=p.x-start.x,dy=p.y-start.y;if(Math.hypot(dx,dy)<c.threshold)return null;return pages>1&&Math.abs(dx)>Math.abs(dy)*c.horizontalRatio?'page':'drag';}
/** 页码始终夹在有效范围内，翻页只刷新装备区域。 */
function turn(v,start,p){const pager=v.equipmentPager;if(!pager||Math.abs(p.x-start.x)<c.threshold)return;const next=Math.max(0,Math.min(pager.pages-1,(v.equipmentPage||0)+(p.x<start.x?1:-1)));if(next!==v.equipmentPage){v.equipmentPage=next;pager.refresh();}}
/** 空白区域与装备图标共用翻页方向，系统取消不得切页。 */
function bind(v,node,point){const E=v.cc.Node.EventType;let start=null,mode=null;node.on(E.TOUCH_START,e=>{e.propagationStopped=true;start=point(e);mode=null;});node.on(E.TOUCH_MOVE,e=>{e.propagationStopped=true;if(start&&!mode)mode=intent(start,point(e),v.equipmentPager?.pages||1);});const end=e=>{e.propagationStopped=true;if(start&&mode==='page')turn(v,start,point(e));start=null;};node.on(E.TOUCH_END,end);node.on(E.TOUCH_CANCEL,e=>{if(e.getEventCode&&e.getEventCode()===v.cc.Input?.EventType.TOUCH_END)end(e);else start=null;});}
module.exports={intent,turn,bind};
