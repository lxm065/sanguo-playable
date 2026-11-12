// Faceted ice-shell recipe using PixelFX's MIT painter; no stock actor is drawn.
import { fit, sparkle, TAU, WHITE } from '../../core/index.js';
export const meta = { name: 'Combat ice shell', size: [104,144], origin: [52,132], duration: 1.5, loop: true, fps: 12, bg: 'ground',
  options: { palette:['#19334d','#315f85','#468caf','#78bfd7','#b3e5ee','#e3faff','#ffffff'], seed:9,
    width:30, height:116, opacity:.22, edgeOpacity:.72, glints:6 } };
export const bodyFree = true;
/** 半透明晶面围住既有模型，保留可辨认的身体和武器。 */
export function draw(p,t,o){
 const C=fit(o.palette,7),w=o.width,h=o.height,phase=t/meta.duration;
 const rim=[[-w,0],[-w-3,-h*.25],[-w,-h*.72],[-w*.62,-h*.95],[-w*.18,-h*.88],[0,-h],[w*.27,-h*.9],[w*.68,-h*.96],[w,-h*.72],[w+2,-h*.24],[w,0]];
 p.poly(rim,C[3],o.opacity);
 p.poly([rim[0],rim[2],[0,-h*.48],[0,0]],C[4],o.opacity*.8);
 p.poly([rim[3],rim[5],rim[7],[0,-h*.48]],C[5],o.opacity*.75);
 p.poly([[0,-h*.48],rim[8],rim[10],[0,0]],C[1],o.opacity*.7);
 p.polyline([...rim,rim[0]],C[5],o.edgeOpacity);
 for(const i of [2,3,5,7,8])p.line(rim[i][0],rim[i][1],0,-h*.48,C[4],.35);
 p.line(0,-h*.48,0,0,C[4],.4);
 const y=-h*(.18+.7*phase);p.line(-w*.85,y,w*.85,y,C[6],.2*Math.sin(phase*Math.PI));
 p.glow(0,-5,w*1.6,C[3],.12);
 for(let i=0;i<o.glints;i++){
  const a=TAU*(i/o.glints+phase),x=Math.cos(a)*w,y0=-h*(.15+.7*((i*.29+phase)%1));
  sparkle(p,x,y0,1+(i%2),WHITE,C[4],.22+.18*Math.sin(a)**2);
 }
}
