import { clamp, fit, TAU } from '../../core/index.js';

export const meta = {
  name: 'Battle feedback', size: [80, 96], origin: [40, 56], duration: .6, loop: false, fps: 15,
  options: { variant: 'heal', palette: ['#1E9F71', '#68E299', '#C9FFAD', '#F4FFF1'] },
};
export const bodyFree = true;

/** 带内外边的细环；透明中心保留真实武将和现有护盾。 */
function rim(p, y, rx, ry, palette, alpha, cut = () => true) {
  p.ellipse(0, y, rx, ry, d => d < .91 ? palette[0] : palette[2],
    (d, a) => d > .82 && cut(a) ? alpha : 0);
}

/** 盾缘亮弧先亮起、再向外扩散，过程中只有短小反弹碎光。 */
function shield(p, u, palette, alpha) {
  const r = 18 + 10 * u;
  rim(p, 0, r, r * 1.12, palette, alpha, a => Math.cos(a * 3 + u * 3) > -.68);
  for (let i = 0; i < 5; i++) {
    const a = i * TAU / 5 + .35, d = r + u * 5;
    p.line(Math.cos(a) * r, Math.sin(a) * r, Math.cos(a) * d, Math.sin(a) * d, palette[3], alpha);
  }
}

/** 三道冰蓝掠影沿水平方向分开，没有假位移或新的角色身体。 */
function evade(p, u, palette, alpha) {
  for (let i = -2; i <= 2; i++) {
    const y = i * 6, start = 8 + u * 15 - Math.abs(i) * 2;
    const end = start + 5 + (1 - u) * 11;
    for (const sign of [-1, 1]) {
      p.line(sign * start, y, sign * end, y - 3, palette[2], alpha);
      p.line(sign * (start - 3), y + 1, sign * (end - 2), y - 2, palette[0], alpha * .65);
    }
  }
}

/** 绿环贴地，十字和光点向上浮起。 */
function heal(p, u, palette, alpha) {
  rim(p, 0, 14 + 13 * u, 5 + 4 * u, palette, alpha);
  for (let i = 0; i < 7; i++) {
    const x = (i - 3) * 7, y = -4 - u * (22 + 5 * (i % 3)) - 4 * (i % 2);
    p.dot(x, y, palette[2], alpha);
    if (i % 2) {
      p.line(x - 2, y, x + 2, y, palette[3], alpha);
      p.line(x, y - 2, x, y + 2, palette[3], alpha);
    }
  }
}

/** 净化从脚边扫到肩部，以白金光和菱形碎点区别于回血。 */
function cleanse(p, u, palette, alpha) {
  const y = -4 - 41 * u, rx = 16 + 7 * Math.sin(Math.PI * u);
  rim(p, y, rx, 5 + 3 * u, palette, alpha);
  p.line(-rx * .8, y + 4, rx * .8, y - 4, palette[3], alpha);
  for (const sign of [-1, 1]) {
    const x = sign * (rx + 3), h = y - 5 - sign * 3;
    p.poly([[x - 2, h], [x, h - 4], [x + 2, h], [x, h + 4]], palette[2], alpha);
  }
}

const variants = { shield, evade, heal, cleanse };

/** 四种反馈共用透明序列帧导出，按配置选择形状与配色。 */
export function draw(p, t, options) {
  const u = clamp(t / meta.duration), alpha = Math.round((1 - u) * 8) / 8;
  variants[options.variant](p, u, fit(options.palette, 4), alpha);
}
