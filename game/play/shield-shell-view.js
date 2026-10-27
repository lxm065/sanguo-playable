'use strict';
const style=require('./shield-shell-config');
/** 按主题基色叠加透明度，避免中心膜遮住武将动作。 */
function color(v,hex,opacity){return new v.cc.Color(hex.slice(0,7)+Math.round(opacity).toString(16).padStart(2,'0'));}
/** 用直线贝塞尔构造多边形，兼容统一图形绘制接口。 */
function path(g,points,closed=false){g.moveTo(...points[0]);for(let i=1;i<points.length;i++)g.bezierCurveTo(...points[i-1],...points[i],...points[i]);if(closed)g.bezierCurveTo(...points.at(-1),...points[0],...points[0]);}
/** 将曲面蜂巢铺满护罩，先描暗衬再描亮线，确保缩小后仍能从战场背景中辨认。 */
function mesh(v,g,c){const rx=c.width/2,ry=c.height/2,segments=require('./shield-shell-mesh').segments();for(const underlay of [true,false]){g.lineWidth=underlay?style.mesh.underlay.width:style.mesh.width;for(const segment of segments){g.strokeColor=underlay?color(v,style.mesh.underlay.color,style.mesh.underlay.opacity):color(v,c.highlight.color,style.mesh.opacity+(style.mesh.edgeOpacity-style.mesh.opacity)*segment.edge);path(g,segment.points.map(([x,y])=>[x*rx,y*ry]));g.stroke();}}}
/** 两条倾斜光带按前后半圈分层，移动亮点表现沿护罩旋转的流光。 */
function orbit(v,g,c,front,t){const rx=c.width/2,ry=c.height/2,s=style.orbit;for(let ring=0;ring<s.count;ring++){const tilt=ring%2?-s.tilt:s.tilt;for(let i=0;i<s.segments;i++){const a=i*Math.PI*2/s.segments,b=(i+1)*Math.PI*2/s.segments;if((Math.sin((a+b)/2)>0)!==front)continue;const point=q=>[Math.cos(q)*rx*s.radius,Math.sin(q)*ry*s.height+Math.cos(q)*ry*tilt];const brightness=.25+.75*Math.pow((1+Math.cos(a-t*Math.PI*2/s.period-ring*Math.PI))/2,6);g.strokeColor=color(v,c.highlight.color,s.opacity*brightness);for(const glow of [4,2,1]){g.strokeColor=color(v,c.highlight.color,s.opacity*brightness/(glow*glow));g.lineWidth=s.width*glow;path(g,[point(a),point(b)]);g.stroke();}}}}
/** 前后层构成光滑椭圆护罩，连续六边形蜂巢纹理为主，柔和光带为辅。 */
function draw(v,g,c,front,t=0){const rx=c.width/2,ry=c.height/2;if(front){g.fillColor=color(v,c.fill,style.centerOpacity);g.ellipse(0,0,rx,ry);g.fill();mesh(v,g,c);g.strokeColor=color(v,c.highlight.color,style.rim.opacity);g.lineWidth=style.rim.width;g.ellipse(0,0,rx*style.rim.inset,ry*style.rim.inset);g.stroke();}else for(const rim of c.glow){g.lineWidth=rim.width;g.strokeColor=new v.cc.Color(rim.color);g.ellipse(0,0,rx,ry);g.stroke();}orbit(v,g,c,front,t);}
/** 注册统一时钟重绘，保留轻微呼吸并让父节点销毁自然回收所有画面。 */
function pulse(v,n,c,front=false){const g=n.getComponent?.(v.cc.Graphics);if(g)(v.shieldShells||(v.shieldShells=[])).push({node:n,g,c,front});const duration=c.pulseSeconds/(v.speed||1);v.cc.tween(n).to(duration,{scale:new v.cc.Vec3(c.pulseScale,c.pulseScale,1)},{easing:'sineInOut'}).to(duration,{scale:new v.cc.Vec3(1,1,1)},{easing:'sineInOut'}).union().repeatForever().start();}
/** 共享限帧更新，变速与暂停随战报时钟推进，无独立计时器残留。 */
function update(v){v.shieldShells=(v.shieldShells||[]).filter(s=>s.node.isValid);const t=v.elapsed||0;if(t-(v.shieldShellLast??-1)<style.frameInterval)return;v.shieldShellLast=t;for(const s of v.shieldShells){s.g.clear();draw(v,s.g,s.c,s.front,t);}}
/** 战斗结束释放登记引用，具体节点由各护盾生命周期负责销毁。 */
function clear(v){v.shieldShells=[];delete v.shieldShellLast;}
module.exports={draw,pulse,update,clear};
