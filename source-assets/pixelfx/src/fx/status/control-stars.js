// Uses PixelFX's MIT stunned-star renderer, Copyright (c) 2026 Hugo Duprez and Patch.
import * as stunned from './stunned.js';
export const meta = { ...stunned.meta, name: 'Combat stun stars', size: [80, 40], origin: [40, 20], actor: undefined,
  options: { ...stunned.meta.options, actor: { w: 30, y: 0 } } };
export const bodyFree = true;
/** 只借用星星与小鸟环，不导出人偶动作或绘制任何角色身体。 */
export function drawBack(p,t,o){stunned.drawBack(p,t,o);}
/** 前景星环与闪点由既有PixelFX绘制器生成。 */
export function draw(p,t,o){stunned.draw(p,t,o);}
