'use strict';
/** 后层柔光包住全身，前层透明膜和反光弧表现球形体积。 */
function draw(v,g,c,front){
 const rx=c.width/2,ry=c.height/2;
 if(front){
  g.fillColor=new v.cc.Color(c.fill);g.ellipse(0,0,rx,ry);g.fill();
  g.lineWidth=c.highlight.width;g.strokeColor=new v.cc.Color(c.highlight.color);
  for(const curve of c.highlight.curves){const p=curve.map(([x,y])=>[x*rx,y*ry]);g.moveTo(...p[0]);g.bezierCurveTo(...p[1],...p[2],...p[3]);g.stroke();}
 }else for(const rim of c.glow){g.lineWidth=rim.width;g.strokeColor=new v.cc.Color(rim.color);g.ellipse(0,0,rx,ry);g.stroke();}
}
/** 前后两层同步呼吸，护罩始终随角色移动，不遮挡头顶信息。 */
function pulse(v,n,c){const duration=c.pulseSeconds/(v.speed||1);v.cc.tween(n).to(duration,{scale:new v.cc.Vec3(c.pulseScale,c.pulseScale,1)},{easing:'sineInOut'}).to(duration,{scale:new v.cc.Vec3(1,1,1)},{easing:'sineInOut'}).union().repeatForever().start();}
module.exports={draw,pulse};
