import { clamp, fit, rng, TAU } from '../../core/index.js';

export const meta = {
  name: 'Combat area pulse', size: [128, 96], origin: [64, 62], duration: .8, fps: 10, loop: false,
  options: { variant: 'blizzard', palette: ['#447695', '#80CBED', '#D2F7FF', '#FFFFFF'] },
};
export const bodyFree = true;

/** 一波斜掠雪幕由少量亮冰与飘雪组成，每片冰只在其落地后散开。 */
function blizzard(p, u, c) {
  for (let i = 0; i < 30; i++) {
    const r = rng(81, i), theta = r.range(0, TAU), reach = Math.sqrt(r.range(0, 1));
    const x = Math.cos(theta) * reach * 52, y = Math.sin(theta) * reach * 23;
    const phase = (u - r.range(0, .24)) * 1.6;
    if (phase < 0 || phase > 1.3) continue;
    if (phase < 1) {
      const h = (1 - phase) * r.range(10, 29), a = Math.min(1, phase * 6 + .15);
      const dx = x - h * .44, dy = y - h, length = r.range(2, 10);
      p.line(dx - length * .44, dy - length, dx, dy, c[1], a);
      p.line(dx - 2, dy - 4, dx, dy, c[3], a);
      if (i % 3 === 0) p.poly([[dx - 3, dy - 4], [dx + 1, dy - 7], [dx + 3, dy + 1], [dx, dy + 4]], c[2], a);
    } else {
      const d = (phase - 1) * 24, a = 1 - (phase - 1) / .3;
      p.line(x - d, y, x - d / 2, y - 2, c[1], a);
      p.line(x + d, y, x + d / 2, y + 1, c[2], a);
    }
  }
}

/** 虎面线条悬于张飞身前，声浪沿地面推开，中心保留透明。 */
function tiger(p, u, c) {
  const a = Math.min(1, .58 + u * 5) * (1 - u * u), rx = 13 + 42 * u;
  const s = 1 + .27 * u, y = -27 - 10 * u;
  const half = [[0,-15],[7,-17],[11,-14],[17,-17],[19,-12],[17,-6],[18,0],[13,5],[10,11],[4,14],[0,12]];
  const face = [...half, ...half.slice(1, -1).reverse().map(([x, h]) => [-x, h])].map(([x, h]) => [x * s, y + h * s]);
  p.poly(face, c[0], a * .56);
  p.polyline([...face, face[0]], c[2], a);
  p.ellipse(0, 1, rx, rx * .36, c[1], (d, angle) =>
    d > .84 && Math.cos(angle * 3) > -.72 ? a : 0);
  for (const sign of [-1, 1]) {
    const path = points => points.map(([x, h]) => [x * s * sign, y + h * s]);
    p.polyline(path([[1,-10],[6,-8],[10,-8],[14,-10]]), c[3], a);
    p.poly(path([[4,-5],[13,-5],[10,-2],[6,-2]]), c[3], a);
    p.polyline(path([[17,0],[10,1],[7,4],[3,5],[0,3]]), c[2], a);
    p.polyline(path([[13,6],[8,6],[4,9],[0,10]]), c[2], a);
    for (let i = 0; i < 3; i++) p.line(sign * (rx - 5), 5 - i * 3, sign * (rx + i * 2), 4 - i * 4, c[2], a);
  }
}

/** 按离线配方导出透明冰雪或虎纹图集。 */
export function draw(p, t, options) {
  const u = clamp(t / meta.duration), colors = fit(options.palette, 4);
  if (options.variant === 'tiger') tiger(p, u, colors);
  else blizzard(p, u, colors);
}
