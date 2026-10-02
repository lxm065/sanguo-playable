"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  http = require("node:http"),
  crypto = require("node:crypto");
const root = path.resolve(__dirname, ".."),
  settings = require("./render.config.json"),
  sources = require("./portrait-sources.cjs"),
  policy = require("./battle-render-config.cjs");
const sharp = require("../../analysis-work/node_modules/sharp");
/** 每个模型独立索引同地图资源，不修改源素材，也不跨地图猜测贴图。 */
function index(dir, base, map) {
  if (!fs.existsSync(dir)) return;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, e.name);
    if (e.isDirectory()) index(file, base, map);
    else
      map.set(
        path.relative(base, file).replace(/\\/g, "/").toLowerCase(),
        file,
      );
  }
}
/** 读取透明像素实际边界，用于统一身体占格尺寸与脚底锚点。 */
async function bounds(buffer) {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  let left = info.width,
    top = info.height,
    right = 0,
    bottom = 0;
  for (let y = 0; y < info.height; y++)
    for (let x = 0; x < info.width; x++)
      if (data[(y * info.width + x) * 4 + 3] > policy.alphaThreshold) {
        left = Math.min(left, x);
        right = Math.max(right, x);
        top = Math.min(top, y);
        bottom = Math.max(bottom, y);
      }
  if (right <= left || bottom <= top) throw Error("模型为空白");
  return {
    left,
    top,
    right,
    bottom,
    width: right - left + 1,
    height: bottom - top + 1,
  };
}
/** 直接打包透明模型动画帧，方向共用比例，保持动作本身的位移。 */
async function pack(id, frames, animations, anchors, record) {
  const size = policy.frameSize,
    columns = 8,
    perPage = 64,
    out = path.join(root, "game/skin-assets"),
    key = "battle-" + id;
  const scale = Math.min(
    policy.targetBodyHeight /
      Math.max(...Object.values(anchors).map((b) => b.height)),
    policy.maxBodyWidth /
      Math.max(...Object.values(anchors).map((b) => b.width)),
  );
  const skeleton = {
    skeleton: { spine: "3.8.99" },
    bones: [{ name: "root" }],
    slots: [
      {
        name: "body",
        bone: "root",
        attachment: animations["idle-s"].frames[0],
      },
    ],
    skins: [{ name: "default", attachments: { body: {} } }],
    animations: {},
  };
  for (const [name, a] of Object.entries(animations)) {
    const timeline = a.frames.map((name, i) => ({
      time: i / policy.fps,
      name,
    }));
    timeline.push({ time: a.duration, name: a.frames.at(-1) });
    skeleton.animations[name] = { slots: { body: { attachment: timeline } } };
  }
  for (const f of frames) {
    const b = anchors[f.direction];
    skeleton.skins[0].attachments.body[f.name] = {
      x: (-(b.left + b.right - size) / 2) * scale,
      y: (b.bottom - size / 2) * scale,
      width: size * scale,
      height: size * scale,
    };
  }
  let atlas = "";
  const textures = [];
  for (let start = 0; start < frames.length; start += perPage) {
    const batch = frames.slice(start, start + perPage),
      name = key + "-" + textures.length + ".png",
      height = Math.ceil(batch.length / columns) * size,
      width = columns * size;
    textures.push(name);
    atlas +=
      "\n" +
      name +
      "\nsize: " +
      width +
      "," +
      height +
      "\nformat: RGBA8888\nfilter: Linear,Linear\nrepeat: none\n";
    const composites = batch.map((f, i) => {
      const left = (i % columns) * size,
        top = Math.floor(i / columns) * size;
      atlas +=
        f.name +
        "\n  rotate: false\n  xy: " +
        left +
        ", " +
        top +
        "\n  size: " +
        size +
        ", " +
        size +
        "\n  orig: " +
        size +
        ", " +
        size +
        "\n  offset: 0, 0\n  index: -1\n";
      return { input: f.buffer, left, top };
    });
    await sharp({
      create: {
        width,
        height,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite(composites)
      .png({ palette: true, quality: 90, effort: 7 })
      .toFile(path.join(out, name));
  }
  fs.writeFileSync(path.join(out, key + ".json"), JSON.stringify(skeleton));
  fs.writeFileSync(path.join(out, key + ".atlas"), atlas);
  fs.writeFileSync(
    path.join(out, key + "-manifest.json"),
    JSON.stringify(
      {
        textures,
        frames: frames.length,
        actions: Object.fromEntries(
          Object.entries(animations).map(([k, v]) => [
            k,
            { source: v.source, duration: v.duration },
          ]),
        ),
        directions: Object.keys(policy.directions),
        scale,
        anchors,
        ...record,
      },
      null,
      2,
    ),
  );
  const preview = frames.find((f) => f.name === "idle-se-000");
  fs.mkdirSync(path.join(root, "evidence/battle-models"), { recursive: true });
  fs.writeFileSync(
    path.join(root, "evidence/battle-models", id + ".png"),
    preview.buffer,
  );
}
/** 批量读取原始骨骼动作并渲染五方向，另外三方向由运行时镜像。 */
async function main() {
  let files = new Map(),
    used = new Map();
  const server = http.createServer((req, res) => {
    const url = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      ),
      file =
        url === "/"
          ? path.join(__dirname, "render.html")
          : url === "/bundle.js"
            ? path.join(settings.rendererHome, "viewer.bundle.js")
            : files.get(url.slice(7).toLowerCase());
    if (!file) {
      res.writeHead(404);
      return res.end(url);
    }
    const data = fs.readFileSync(file);
    if (url.startsWith("/asset/"))
      used.set(url.slice(7), {
        source: file,
        sha256: crypto.createHash("sha256").update(data).digest("hex"),
      });
    res.end(data);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const browser = await require(
    path.join(settings.rendererHome, "node_modules/puppeteer-core"),
  ).launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
    defaultViewport: { width: policy.frameSize, height: policy.frameSize },
  });
  try {
    for (const [id, mapKey, model] of sources.rows) {
      if (process.argv.length > 2 && !process.argv.slice(2).includes(id))
        continue;
      files = new Map();
      used = new Map();
      const sourceRoot = path.join(sources.assetRoot, sources.roots[mapKey]);
      index(sourceRoot, sourceRoot, files);
      for (const relative of [
        "ReplaceableTextures/TeamColor",
        "ReplaceableTextures/TeamGlow",
      ])
        index(
          path.join(settings.teamResources, relative),
          settings.teamResources,
          files,
        );
      const page = await browser.newPage();
      try {
        await page.goto("http://127.0.0.1:" + server.address().port);
        const metadata = await page.evaluate((c) => api.initialize(c), {
          ...settings,
          sourceRoot,
          model,
          frameSize: policy.frameSize,
          omitSceneEvents: true,
          omitTeamGlow: true,
          portraitOnly: true,
        });
        const actions = {};
        for (const [name, pattern] of Object.entries(policy.actionPatterns)) {
          const sequence =
            metadata.sequences.find(
              (s) => s.name === policy.overrides[id]?.[name],
            ) ||
            (name === "idle" &&
              metadata.sequences.find((s) => s.name === "Stand")) ||
            metadata.sequences.find((s) =>
              new RegExp(pattern, "i").test(s.name),
            );
          if (!sequence && name !== "skill2") throw Error("缺少 " + name);
          actions[name] = sequence || actions.skill1;
        }
        // 使用蒙皮后的待机包围盒，避免模型文件内不可见辅助几何体撑大镜头。
        const camera = await page.evaluate((idle) => {
          api.frame(idle, 0);
          let low = [Infinity, Infinity, Infinity],
            high = [-Infinity, -Infinity, -Infinity];
          for (const [gi, g] of parser.geosets.entries()) {
            if (inst.geosetColors[gi]?.[3] < 0.1) continue;
            const groups = [];
            let offset = 0;
            for (const count of g.matrixGroups) {
              groups.push(
                Array.from(g.matrixIndices.slice(offset, offset + count)),
              );
              offset += count;
            }
            for (let i = 0; i < g.vertices.length; i += 3) {
              const ids = groups[g.vertexGroups[i / 3]] || [],
                v = Array.from(g.vertices.slice(i, i + 3)),
                p = [0, 0, 0];
              for (const id of ids) {
                const m = inst.nodes[id].worldMatrix;
                for (let k = 0; k < 3; k++)
                  p[k] +=
                    (m[k] * v[0] +
                      m[k + 4] * v[1] +
                      m[k + 8] * v[2] +
                      m[k + 12]) /
                    ids.length;
              }
              for (let k = 0; k < 3; k++) {
                low[k] = Math.min(low[k], ids.length ? p[k] : v[k]);
                high[k] = Math.max(high[k], ids.length ? p[k] : v[k]);
              }
            }
          }
          return {
            center: low.map((v, k) => (v + high[k]) / 2),
            height: high[2] - low[2],
            span: Math.max(
              high[2] - low[2],
              Math.hypot(high[0] - low[0], high[1] - low[1]),
            ),
          };
        }, actions.idle.name);
        const frames = [],
          animations = {},
          anchors = {},
          cameras = {};
        for (const [direction, degrees] of Object.entries(policy.directions)) {
          await page.evaluate(
            ({ camera, degrees, policy }) => {
              const a = (degrees * Math.PI) / 180,
                d =
                  (camera.span * policy.cameraMargin) /
                  (2 * Math.tan(Math.PI / 8)),
                v = [Math.cos(a), Math.sin(a), policy.cameraElevation],
                len = Math.hypot(...v);
              scene.camera.moveToAndFace(
                camera.center.map((x, k) => x + (v[k] / len) * d),
                camera.center,
                [0, 0, 1],
              );
            },
            { camera, degrees, policy },
          );
          // 按实际可见像素重新居中并拉近镜头，保证每位武将具有相近的有效分辨率。
          const initialImage = await page.evaluate(
              (name) => api.frame(name, 0),
              actions.idle.name,
            ),
            visible = await bounds(
              Buffer.from(initialImage.split(",")[1], "base64"),
            );
          await page.evaluate(
            ({ camera, degrees, policy, visible }) => {
              const a = (degrees * Math.PI) / 180,
                e = policy.cameraElevation,
                len = Math.hypot(1, e),
                d =
                  (camera.span * policy.cameraMargin) /
                  (2 * Math.tan(Math.PI / 8)),
                pixel = (2 * d * Math.tan(Math.PI / 8)) / policy.frameSize,
                right = [-Math.sin(a), Math.cos(a), 0],
                up = [
                  (-Math.cos(a) * e) / len,
                  (-Math.sin(a) * e) / len,
                  1 / len,
                ],
                dx = (visible.left + visible.right + 1 - policy.frameSize) / 2,
                dy = (policy.frameSize - visible.top - visible.bottom - 1) / 2,
                center = camera.center.map(
                  (v, k) => v + pixel * (dx * right[k] + dy * up[k]),
                ),
                distance =
                  (d * Math.max(visible.width, visible.height)) /
                  policy.visibleSpan,
                dir = [Math.cos(a), Math.sin(a), e];
              window.battleCamera = { center, dir, len, distance };
              scene.camera.moveToAndFace(
                center.map((v, k) => v + (dir[k] / len) * distance),
                center,
                [0, 0, 1],
              );
            },
            { camera, degrees, policy, visible },
          );
          cameras[direction] = await page.evaluate(
            ({ actions, policy }) => {
              const c = window.battleCamera,
                gl = viewer.gl,
                pixels = new Uint8Array(
                  policy.frameSize * policy.frameSize * 4,
                );
              let zoom = 1;
              // 全帧预检画布边缘，统一放远所有方向，避免攻击和死亡动作裁切。
              for (let attempt = 0; attempt < 8; attempt++) {
                scene.camera.moveToAndFace(
                  c.center.map(
                    (v, k) => v + (c.dir[k] / c.len) * c.distance * zoom,
                  ),
                  c.center,
                  [0, 0, 1],
                );
                let clipped = false;
                for (const [action, seq] of Object.entries(actions)) {
                  const seconds = Math.min(
                      (seq.interval[1] - seq.interval[0]) / 1000,
                      policy.loopingLimits[action] || Infinity,
                    ),
                    count = Math.max(2, Math.ceil(seconds * policy.fps));
                  for (let i = 0; i < count && !clipped; i++) {
                    api.frame(
                      seq.name,
                      Math.min(seconds * 1000 - 1, (i / policy.fps) * 1000),
                    );
                    gl.readPixels(
                      0,
                      0,
                      policy.frameSize,
                      policy.frameSize,
                      gl.RGBA,
                      gl.UNSIGNED_BYTE,
                      pixels,
                    );
                    const n = policy.frameSize;
                    for (let k = 0; k < n; k++)
                      if (
                        pixels[k * 4 + 3] > policy.alphaThreshold ||
                        pixels[((n - 1) * n + k) * 4 + 3] >
                          policy.alphaThreshold ||
                        pixels[k * n * 4 + 3] > policy.alphaThreshold ||
                        pixels[(k * n + n - 1) * 4 + 3] > policy.alphaThreshold
                      ) {
                        clipped = true;
                        break;
                      }
                  }
                  if (clipped) break;
                }
                if (!clipped) return { ...c, zoom };
                zoom *= 1.4;
              }
              throw Error("动画取景仍触及边缘");
            },
            { actions, policy },
          );
        }
        const uniformZoom =
          Math.max(...Object.values(cameras).map((c) => c.zoom)) *
          (policy.overrides[id]?.padding || 1);
        for (const direction of Object.keys(policy.directions)) {
          await page.evaluate(
            ({ c, zoom }) => {
              scene.camera.moveToAndFace(
                c.center.map(
                  (v, k) => v + (c.dir[k] / c.len) * c.distance * zoom,
                ),
                c.center,
                [0, 0, 1],
              );
            },
            { c: cameras[direction], zoom: uniformZoom },
          );
          for (const [action, sequence] of Object.entries(actions)) {
            const original =
                (sequence.interval[1] - sequence.interval[0]) / 1000,
              duration = Math.min(
                original,
                policy.loopingLimits[action] || Infinity,
              ),
              count = Math.max(2, Math.ceil(duration * policy.fps)),
              key = action + "-" + direction;
            animations[key] = { source: sequence.name, duration, frames: [] };
            for (let i = 0; i < count; i++) {
              const image = await page.evaluate(
                  ({ name, ms }) => api.frame(name, ms),
                  {
                    name: sequence.name,
                    ms: Math.min(original * 1000 - 1, (i / policy.fps) * 1000),
                  },
                ),
                buffer = Buffer.from(image.split(",")[1], "base64"),
                name = key + "-" + String(i).padStart(3, "0");
              frames.push({ name, buffer, direction });
              animations[key].frames.push(name);
              if (action === "idle" && i === 0)
                anchors[direction] = await bounds(buffer);
            }
          }
        }
        await pack(id, frames, animations, anchors, {
          model,
          sourceRoot,
          dependencies: Object.fromEntries(used),
          camera,
          uniformZoom,
          rendering: "MDX原始骨骼动画烘焙，多方向Spine附件序列",
        });
        console.log(id + " OK " + frames.length + " frames");
      } catch (e) {
        console.error(id + " FAILED " + e.stack);
        process.exitCode = 1;
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
    server.close();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
