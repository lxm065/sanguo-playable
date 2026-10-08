"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  sharp = require("../../analysis-work/node_modules/sharp");
const root = path.resolve(__dirname, ".."),
  out = path.join(root, "docs/battle-refinement"),
  appearance = require("../game/play/battle-appearance"),
  roster = require("../game/play/expedition-roster");
/** 生成来源清单与等比例模型总览，同时移除本轮生成器留下的未引用图集。 */
async function main() {
  fs.mkdirSync(out, { recursive: true });
  const records = [],
    parts = [],
    labels = [];
  let total = 0,
    gpu = 0;
  for (const [i, [id, entry]] of require("../game/play/appearance-policy").entries(appearance).entries()) {
    const dir = path.join(root, "game/skin-assets"),
      manifest = JSON.parse(
        fs.readFileSync(
          path.join(dir, entry.assetKey + "-manifest.json"),
          "utf8",
        ),
      ),
      hero = roster.find((h) => h.id === id);
    for (const name of fs.readdirSync(dir)) {
      if (
        !new RegExp("^" + entry.assetKey + "-(?:packed-)?[0-9]+\\.png$").test(
          name,
        ) ||
        manifest.textures.includes(name)
      )
        continue;
      const target = path.resolve(dir, name);
      if (path.dirname(target) !== dir) throw Error("路径越界");
      fs.unlinkSync(target);
    }
    const bytes = manifest.textures.reduce(
      (n, file) => n + fs.statSync(path.join(dir, file)).size,
      0,
    );
    total += bytes;
    gpu += manifest.compacted.afterBytes;
    records.push({
      id,
      name: hero.name,
      assetKey: entry.assetKey,
      minStar: entry.minStar,
      sharedAnimationKey: entry.animationKey,
      model: manifest.model,
      sourceType: manifest.sourceType || (manifest.nativeWow ? 'wow-m2' : manifest.authored ? 'authored-glb' : 'warcraft-mdx'),
      sourceRoot: manifest.sourceRoot,
      animationSources: Object.fromEntries(
        Object.entries(manifest.actions).filter(([k]) => k.endsWith("-s")),
      ),
      frames: manifest.frames,
      textures: manifest.textures.length,
      bytes,
      textureBytes: manifest.compacted.afterBytes,
      boundaryFrames: manifest.compacted.boundaryFrames,
    });
    const b = manifest.anchors.se,
      source = path.join(root, "evidence/battle-models", entry.assetKey.replace(/^battle-/, "") + ".png"),
      buffer = await sharp(source)
        .extract({ left: b.left, top: b.top, width: b.width, height: b.height })
        .resize({
          width: Math.round(b.width * manifest.scale),
          height: Math.round(b.height * manifest.scale),
        })
        .png()
        .toBuffer(),
      meta = await sharp(buffer).metadata(),
      x = (i % 5) * 180,
      y = Math.floor(i / 5) * 180;
    parts.push({
      input: buffer,
      left: x + Math.round((180 - meta.width) / 2),
      top: y + 125 - meta.height,
    });
    labels.push(
      '<text x="' +
        (x + 90) +
        '" y="' +
        (y + 153) +
        '">' +
        hero.name +
        "</text>",
    );
  }
  const height = Math.ceil(records.length / 5) * 180;
  const svg =
    '<svg width="900" height="'+height+'"><style>text{font-family:Microsoft YaHei;font-size:22px;fill:#f0dfbe;text-anchor:middle}</style>' +
    labels.join("") +
    "</svg>";
  await sharp({
    create: { width: 900, height, channels: 4, background: "#3d4238" },
  })
    .composite([...parts, { input: Buffer.from(svg), left: 0, top: 0 }])
    .png()
    .toFile(path.join(out, "models-overview.png"));
  fs.writeFileSync(
    path.join(out, "model-sources.json"),
    JSON.stringify(
      {
        rendering: "源模型骨骼动作烘焙为Spine附件序列；逐项记录MDX、魔兽M2或原创GLB来源，不是实时3D模型加载",
        totalTextureFileBytes: total,
        totalTextureMemoryBytes: gpu,
        models: records,
        pending: appearance.pending.map((id) => ({
          id,
          name: roster.find((h) => h.id === id).name,
          status: "头像保留，模型待制作",
        })),
      },
      null,
      2,
    ),
  );
  console.log({
    models: records.length,
    bytes: total,
    gpuBytes: gpu,
    clipped: records.filter((r) => r.boundaryFrames),
  });
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
