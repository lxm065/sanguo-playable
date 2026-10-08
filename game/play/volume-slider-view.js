'use strict';
const c=require('./audio-settings-config');
/** 触摸位置映射为0至1音量，拖出滑条边界时夹取到端点。 */
function valueAt(x,width){return Math.max(0,Math.min(1,x/width+.5));}
/** 大触摸区域滑条，拖动即时更新原生音量，结束或取消时保存偏好。 */
function render(v,parent,row,a){const cc=v.cc,u=v.ui,l=c.slider,n=u.node(parent,'volume-'+row.key,l.x,row.y,l.width,l.touchHeight),g=n.addComponent(cc.Graphics),label=u.text(parent,'',l.percentX,row.y,24,'#594023',85,44);let dragging=false;
 /** 同步轨道、拇指和百分比，不重绘弹窗以免丢失触摸。 */
 function draw(){const level=a.volume(row.key),left=-l.width/2,knob=left+l.width*level;g.clear();g.fillColor=new cc.Color(l.track);g.roundRect(left,-l.height/2,l.width,l.height,l.height/2);g.fill();if(level>0){g.fillColor=new cc.Color(l.fill);g.roundRect(left,-l.height/2,Math.max(l.height,l.width*level),l.height,l.height/2);g.fill();}g.fillColor=new cc.Color(l.knob);g.strokeColor=new cc.Color(l.outline);g.lineWidth=2;g.circle(knob,0,l.radius);g.fill();g.stroke();label.string=Math.round(level*100)+'%';}
 /** UI坐标转换到滑条本地坐标，避免设备缩放影响音量选择。 */
 function change(e){e.propagationStopped=true;const p=e.getUILocation(),local=n.getComponent(cc.UITransform).convertToNodeSpaceAR(new cc.Vec3(p.x,p.y,0));a.setVolume(row.key,valueAt(local.x,l.width),false);draw();}
 n.on(cc.Node.EventType.TOUCH_START,e=>{dragging=true;change(e);});n.on(cc.Node.EventType.TOUCH_MOVE,e=>{if(dragging)change(e);});n.on(cc.Node.EventType.TOUCH_END,e=>{if(dragging){change(e);dragging=false;a.save();}});n.on(cc.Node.EventType.TOUCH_CANCEL,e=>{e.propagationStopped=true;if(dragging){dragging=false;a.save();}});draw();return n;}
module.exports={render,valueAt};
