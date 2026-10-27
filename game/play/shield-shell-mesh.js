'use strict';
const config=require('./shield-shell-config').mesh;
let cached;
/** 将六边形边裁剪到半球展开圆，边界格子只裁切而不整格丢弃。 */
function clip(a,b,radius){const dx=b[0]-a[0],dy=b[1]-a[1],aa=dx*dx+dy*dy,bb=2*(a[0]*dx+a[1]*dy),cc=a[0]*a[0]+a[1]*a[1]-radius*radius,discriminant=bb*bb-4*aa*cc;if(discriminant<0)return null;const d=Math.sqrt(discriminant),lo=Math.max(0,(-bb-d)/(2*aa)),hi=Math.min(1,(-bb+d)/(2*aa));return hi<=lo?null:[[a[0]+dx*lo,a[1]+dy*lo],[a[0]+dx*hi,a[1]+dy*hi]];}
/** 半球正投影：中心格子舒展，越接近轮廓越被弧面压缩，所有点都留在椭圆内。 */
function project(p){const r=Math.hypot(...p),scale=r?Math.sin(r)/r:1;return [p[0]*scale,p[1]*scale];}
/** 缓存无尺寸的曲面蜂巢边，三种配色和所有角色共用，避免逐帧重算几何。 */
function segments(){if(cached)return cached;const radius=config.hemisphereDegrees*Math.PI/180,r=config.radius,dx=r*1.5,dy=Math.sqrt(3)*r,columns=Math.ceil(radius/dx)+1,rows=Math.ceil(radius/dy)+1,seen=new Set(),result=[];for(let col=-columns;col<=columns;col++)for(let row=-rows;row<=rows;row++){const x=col*dx,y=(row+(Math.abs(col)%2)/2)*dy,p=Array.from({length:6},(_,i)=>[x+r*Math.cos(i*Math.PI/3),y+r*Math.sin(i*Math.PI/3)]);for(let i=0;i<6;i++){const edge=clip(p[i],p[(i+1)%6],radius);if(!edge)continue;const key=edge.map(p=>p.map(n=>n.toFixed(6)).join(',')).sort().join(':');if(seen.has(key))continue;seen.add(key);const [a,b]=edge,points=Array.from({length:config.samples+1},(_,i)=>{const t=i/config.samples;return project([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]);}),middle=points[Math.floor(config.samples/2)];result.push({points,edge:Math.min(1,Math.hypot(...middle))});}}cached=result;return cached;}
module.exports={segments};
