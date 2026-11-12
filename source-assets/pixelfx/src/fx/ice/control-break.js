import { fit, rng, clamp, sparkle, TAU, WHITE } from '../../core/index.js';
export const meta = { name:'Combat ice release',size:[112,112],origin:[56,90],duration:.4,loop:false,fps:20,bg:'ground',
  options:{palette:['#315f85','#468caf','#78bfd7','#b3e5ee','#e3faff','#ffffff'],seed:11,count:12,reach:44,height:45} };
export const bodyFree = true;
/** 控制结束时只散开短命冰屑，不重绘模型或制造命中闪白。 */
export function draw(p,t,o){
 const C=fit(o.palette,6),u=clamp(t/meta.duration),fade=(1-u)**2;
 for(let i=0;i<o.count;i++){
  const r=rng(o.seed,i),a=TAU*i/o.count+r.range(-.15,.15),d=o.reach*Math.sqrt(u)*r.range(.5,1);
  const x=Math.cos(a)*d,y=-o.height+Math.sin(a)*d*.55+u*u*20,s=(1-u)*r.range(2,4);
  p.poly([[x-s,y],[x,y-s*1.7],[x+s,y],[x,y+s]],C[3+i%3],fade);
  sparkle(p,x,y,s*.6,WHITE,C[2],fade*.3);
 }
}
