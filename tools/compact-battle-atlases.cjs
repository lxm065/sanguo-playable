"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  sharp = require("../../analysis-work/node_modules/sharp"),
  config = require("../game/play/battle-appearance");
const root = path.resolve(__dirname, "../game/skin-assets"),
  edge = 1024,
  padding = 2;
/** 读取生成器的标准区域描述，避免依据帧数猜测图集坐标。 */
function regions(text) {
  let page = null,
    result = [];
  for (const section of text.trim().split(/\n\n/)) {
    const lines = section.split("\n");
    page = lines[0];
    for (let i = 1; i < lines.length; i++)
      if (lines[i + 1]?.includes("rotate:")) {
        const xy = lines[i + 2].match(/\d+/g).map(Number),
          size = lines[i + 3].match(/\d+/g).map(Number);
        result.push({
          name: lines[i],
          page,
          x: xy[0],
          y: xy[1],
          width: size[0],
          height: size[1],
        });
      }
  }
  return result;
}
/** 去除每帧透明边缘后重新排图集，修正附件锚点，保留原动作和人物尺寸。 */
async function compact(key) {
  const file = (name) => path.join(root, name),
    manifest = JSON.parse(
      fs.readFileSync(file(key + "-manifest.json"), "utf8"),
    );
  if (manifest.compacted) return;
  const skeleton = JSON.parse(fs.readFileSync(file(key + ".json"), "utf8")),
    sources = new Map();
  let before = 0;
  for (const name of manifest.textures) {
    const image = await sharp(file(name))
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    sources.set(name, image);
    before += image.info.width * image.info.height * 4;
  }
  const pages = [];
  let page = {
    data: Buffer.alloc(edge * edge * 4),
    x: padding,
    y: padding,
    row: 0,
    regions: [],
  };
  pages.push(page);
  let clipped = 0;
  for (const region of regions(fs.readFileSync(file(key + ".atlas"), "utf8"))) {
    const src = sources.get(region.page);
    let left = region.width,
      top = region.height,
      right = -1,
      bottom = -1;
    for (let y = 0; y < region.height; y++)
      for (let x = 0; x < region.width; x++) {
        const alpha =
          src.data[((region.y + y) * src.info.width + region.x + x) * 4 + 3];
        if (alpha > 0) {
          left = Math.min(left, x);
          right = Math.max(right, x);
          top = Math.min(top, y);
          bottom = Math.max(bottom, y);
        }
      }
    const hasPixels = right >= left;
    if (right < left) {
      left = top = 0;
      right = bottom = 0;
    }
    if (
      hasPixels &&
      (left === 0 ||
        top === 0 ||
        right === region.width - 1 ||
        bottom === region.height - 1)
    )
      clipped++;
    const width = right - left + 1,
      height = bottom - top + 1;
    if (page.x + width + padding > edge) {
      page.x = padding;
      page.y += page.row + padding;
      page.row = 0;
    }
    if (page.y + height + padding > edge) {
      page = {
        data: Buffer.alloc(edge * edge * 4),
        x: padding,
        y: padding,
        row: 0,
        regions: [],
      };
      pages.push(page);
    }
    const attachment = skeleton.skins[0].attachments.body[region.name],
      scale = attachment.width / region.width;
    attachment.x += (left + width / 2 - region.width / 2) * scale;
    attachment.y -= (top + height / 2 - region.height / 2) * scale;
    attachment.width = width * scale;
    attachment.height = height * scale;
    for (let y = 0; y < height; y++) {
      const start =
        ((region.y + top + y) * src.info.width + region.x + left) * 4;
      src.data.copy(
        page.data,
        ((page.y + y) * edge + page.x) * 4,
        start,
        start + width * 4,
      );
    }
    page.regions.push({
      name: region.name,
      x: page.x,
      y: page.y,
      width,
      height,
    });
    page.x += width + padding;
    page.row = Math.max(page.row, height);
  }
  let atlas = "";
  const textures = [];
  for (const [i, p] of pages.entries()) {
    const name = key + "-packed-" + i + ".png",
      height = Math.max(...p.regions.map((r) => r.y + r.height)) + padding;
    textures.push(name);
    await sharp(p.data.subarray(0, edge * height * 4), {
      raw: { width: edge, height, channels: 4 },
    })
      .png({ palette: true, quality: 90, effort: 7 })
      .toFile(file(name));
    atlas +=
      "\n" +
      name +
      "\nsize: " +
      edge +
      "," +
      height +
      "\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\n";
    for (const r of p.regions)
      atlas +=
        r.name +
        "\n  rotate: false\n  xy: " +
        r.x +
        ", " +
        r.y +
        "\n  size: " +
        r.width +
        ", " +
        r.height +
        "\n  orig: " +
        r.width +
        ", " +
        r.height +
        "\n  offset: 0, 0\n  index: -1\n";
  }
  const old = manifest.textures;
  manifest.textures = textures;
  manifest.compacted = {
    beforeBytes: before,
    afterBytes: pages.reduce(
      (sum, p) =>
        sum +
        edge *
          (Math.max(...p.regions.map((r) => r.y + r.height)) + padding) *
          4,
      0,
    ),
    boundaryFrames: clipped,
  };
  fs.writeFileSync(file(key + ".json"), JSON.stringify(skeleton));
  fs.writeFileSync(file(key + ".atlas"), atlas);
  fs.writeFileSync(
    file(key + "-manifest.json"),
    JSON.stringify(manifest, null, 2),
  );
  for (const name of new Set([
    ...old,
    ...fs
      .readdirSync(root)
      .filter(
        (name) =>
          new RegExp("^" + key + "-(?:packed-)?[0-9]+\\.png$").test(name) &&
          !textures.includes(name),
      ),
  ])) {
    const target = file(name);
    if (path.dirname(target) !== root || !name.startsWith(key + "-"))
      throw Error("非本模型图集");
    fs.unlinkSync(target);
  }
  console.log(key, manifest.compacted);
}
/** 仅整理本轮生成图集，不接触原始模型和已有角色头像。 */
async function main() {
  for (const { assetKey } of Object.values(config.models))
    await compact(assetKey);
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
