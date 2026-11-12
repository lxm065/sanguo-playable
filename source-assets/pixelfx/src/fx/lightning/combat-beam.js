// Adapted from PixelFX's lightning drawing helpers, MIT, Copyright (c) 2026 Hugo Duprez and Patch.
import { fit, rng, WHITE } from '../../core/index.js';
import { bowed, stroke, zigzag, crackle } from './_lib.js';

export const meta = {
  name: 'Combat lightning beam', size: [192, 64], origin: [96, 32], duration: .5, loop: true, fps: 24, bg: 'dark',
  options: { palette: ['#15213c','#234271','#3568a4','#5a9ed4','#8dcced','#bceaff','#e8faff','#ffffff'],
    span: 144, amplitude: 10, branches: 3, frequency: 24, seed: 7 }
};

/** 输出端点固定的横向电弧，供游戏按实际源目标距离缩放，不绘制角色或场景道具。 */
export function draw(p,t,o) {
  const C=fit(o.palette,8),r=rng(o.seed,Math.floor(t*o.frequency)),half=o.span/2;
  stroke(p,bowed(r,-half,0,half,0,r.range(-o.amplitude,o.amplitude),.16,.12),1,C,t<.05?1:.75,{hero:true,light:.5});
  for(let i=0;i<o.branches;i++){
    const x=r.range(-half*.75,half*.75),y=r.range(-o.amplitude,o.amplitude);
    crackle(p,zigzag(r,x,0,x+r.range(-16,16),y,.4,.25),.55,C,.3);
  }
  p.circle(-half,0,1.3,WHITE);p.circle(half,0,1.3,WHITE);
  p.glow(-half,0,12,C[5],.45);p.glow(half,0,15,C[5],.55);
}
