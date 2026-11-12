import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(fs.readFileSync(process.argv[2] ?? path.join(root, 'tools/pixelfx-export.config.json'), 'utf8'));
const vendor = path.resolve(root, config.sourceDirectory);
const { loadEffect, renderFrames } = await import(pathToFileURL(path.join(vendor, 'tools/lib/fxlib.mjs')));
const { encodePNG } = await import(pathToFileURL(path.join(vendor, 'tools/lib/png.mjs')));
const sharp = createRequire(import.meta.url)(path.resolve(root, config.imageLibrary));

/** 计算整段动画共用的裁剪边界，保留原点，保证旋转和定位不随帧抖动。 */
function boundsOf(frames, width, height, pivot) {
  let left = pivot[0], top = pivot[1], right = pivot[0], bottom = pivot[1];
  for (const frame of frames) for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (frame.clear[(y * width + x) * 4 + 3] < config.alphaThreshold) continue;
    left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y);
  }
  return { x: Math.max(0, left - config.padding), y: Math.max(0, top - config.padding),
    right: Math.min(width - 1, right + config.padding), bottom: Math.min(height - 1, bottom + config.padding) };
}

/** 原样拷贝直通透明度像素，避免透明底合成再次乘 alpha 导致光效变暗。 */
function packFrames(frames, sourceWidth, bounds, columns, width, height) {
  const atlasWidth = columns * width, atlasHeight = Math.ceil(frames.length / columns) * height;
  const pixels = new Uint8ClampedArray(atlasWidth * atlasHeight * 4);
  for (const [index, frame] of frames.entries()) for (let row = 0; row < height; row++) {
    const start = ((row + bounds.y) * sourceWidth + bounds.x) * 4;
    const destination = ((Math.floor(index / columns) * height + row) * atlasWidth + index % columns * width) * 4;
    pixels.set(frame.clear.subarray(start, start + width * 4), destination);
  }
  return { pixels, atlasWidth, atlasHeight };
}

/** 输出可重复构建的轻量序列帧与来源摘要；源代码仅用于离线导出。 */
async function exportEffects() {
  const manifest = {}, report = [];
  fs.mkdirSync(path.resolve(root, config.outputDirectory), { recursive: true });
  for (const entry of config.effects) {
    const fx = await loadEffect(entry.source, path.join(vendor, 'src/fx'));
    if (entry.bodyFree && (!fx.mod.bodyFree || fx.meta.actor)) throw Error(entry.id + ' 未通过无角色身体导出约定');
    const rendered = renderFrames(fx, { fps: entry.fps, actor: false, options: entry.options });
    const frames = rendered.frames.filter(frame => frame.t + Number.EPSILON >= (entry.startSeconds ?? 0) && frame.t <= entry.seconds + Number.EPSILON);
    if (!frames.length) throw Error(entry.id + ' 未选择有效帧');
    const pivot = entry.pivot ?? fx.meta.origin;
    const bounds = boundsOf(frames, rendered.w, rendered.h, pivot);
    const sourceWidth = bounds.right - bounds.x + 1, sourceHeight = bounds.bottom - bounds.y + 1;
    const scale = entry.scale ?? 1, width = Math.max(1, Math.round(sourceWidth * scale)), height = Math.max(1, Math.round(sourceHeight * scale));
    const cropped = packFrames(frames, rendered.w, bounds, 1, sourceWidth, sourceHeight);
    const resized = [];
    for (let index = 0; index < frames.length; index++) {
      const clear = await sharp(cropped.pixels, { raw: { width: sourceWidth, height: sourceHeight * frames.length, channels: 4 } })
        .extract({ left: 0, top: index * sourceHeight, width: sourceWidth, height: sourceHeight })
        .resize(width, height, { kernel: 'nearest' }).raw().toBuffer();
      resized.push({ clear });
    }
    const columns = Math.min(Math.floor(config.maxAtlasEdge / width), Math.max(1, Math.ceil(Math.sqrt(frames.length * height / width))));
    const packed = packFrames(resized, width, { x: 0, y: 0 }, columns, width, height);
    if (!columns || packed.atlasWidth > config.maxAtlasEdge || packed.atlasHeight > config.maxAtlasEdge) throw Error(entry.id + ' 超出图集预算');
    const png = encodePNG(packed.atlasWidth, packed.atlasHeight, packed.pixels);
    const file = 'pixelfx/' + entry.id + '.png';
    fs.writeFileSync(path.resolve(root, config.outputDirectory, entry.id + '.png'), png);
    const source = fs.readFileSync(fx.file);
    manifest[entry.id] = { file, kind: 'pixelfx', frameWidth: width, frameHeight: height, columns,
      count: frames.length, fps: entry.fps, pivot: [(pivot[0] - bounds.x) * width / sourceWidth, (pivot[1] - bounds.y) * height / sourceHeight],
      ...(entry.beamSpan ? { beamSpan: entry.beamSpan * width / sourceWidth } : {}),
      ...(entry.budgetGroup ? { budgetGroup: entry.budgetGroup } : {}),
      ...(entry.bodyFree ? { bodyFree: true } : {}),
      sources: [{ source: path.relative(root, fx.file).split(path.sep).join('/'), sha256: crypto.createHash('sha256').update(source).digest('hex') }] };
    report.push({ id: entry.id, frameWidth: width, frameHeight: height, frames: frames.length,
      atlasWidth: packed.atlasWidth, atlasHeight: packed.atlasHeight, pngBytes: png.length,
      rgbaTextureBytes: packed.pixels.length, sha256: crypto.createHash('sha256').update(png).digest('hex') });
  }
  fs.writeFileSync(path.resolve(root, config.manifestFile), "'use strict';\n/** PixelFX 离线生成清单；使用 node tools/export-pixelfx.mjs 重建。 */\nmodule.exports=" + JSON.stringify(manifest, null, 2) + ';\n');
  const result = { effects: report, totalPngBytes: report.reduce((sum, effect) => sum + effect.pngBytes, 0),
    totalRgbaTextureBytes: report.reduce((sum, effect) => sum + effect.rgbaTextureBytes, 0) };
  if (result.totalPngBytes > config.maxPngBytes || result.totalRgbaTextureBytes > config.maxTextureBytes) throw Error('PixelFX 资源超出配置预算');
  fs.mkdirSync(path.dirname(path.resolve(root, config.reportFile)), { recursive: true });
  fs.writeFileSync(path.resolve(root, config.reportFile), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
}

await exportEffects();
