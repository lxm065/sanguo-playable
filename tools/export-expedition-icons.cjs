"use strict";
const fs = require("node:fs"),
  path = require("node:path"),
  sharp = require("../../analysis-work/node_modules/sharp");
const policy = require("../game/play/expedition-config");
/** 解码 Cocos 压缩 UUID，仅用于定位已有包内装备图标。 */
function uuid(value) {
  if (value.length !== 22) return value;
  const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
    hex = "0123456789abcdef";
  let out = value.slice(0, 2);
  for (let i = 2; i < 22; i += 2) {
    const a = chars.indexOf(value[i]),
      b = chars.indexOf(value[i + 1]);
    out += hex[a >> 2] + hex[((a & 3) << 2) | (b >> 4)] + hex[b & 15];
  }
  return [
    out.slice(0, 8),
    out.slice(8, 12),
    out.slice(12, 16),
    out.slice(16, 20),
    out.slice(20),
  ].join("-");
}
/** 将已有独立图标转为统一 PNG，记录来源而不改写原始文件。 */
async function main() {
  const source = path.resolve(
      __dirname,
      "../../sanguo-sample/game/remote/fight-img",
    ),
    config = JSON.parse(
      fs.readFileSync(path.join(source, "config.57987.json"), "utf8"),
    ),
    items = require("../../策划资料库/原始配置/equip_cfg.json"),
    out = path.resolve(__dirname, "../game/skin-assets/equipment"),
    manifest = [];
  fs.mkdirSync(out, { recursive: true });
  const sign=require('../game/play/sign-config'),ids=[...new Set([...policy.equipment.map(x=>x.id),...sign.days.map(r=>r.item),...sign.bluePool].filter(id=>id&&items[id]))];
  for (const item of ids.map(id=>({id}))) {
    const pic = items[item.id].pic,
      index = Object.entries(config.paths).find(
        ([k, v]) => v[0] === "equip/" + pic,
      )[0],
      id = uuid(config.uuids[index]),
      dir = path.join(source, "native", id.slice(0, 2)),
      file = fs.readdirSync(dir).find((f) => f.startsWith(id + "."));
    if (!file) throw Error("缺少图标 " + item.id);
    await sharp(path.join(dir, file))
      .png()
      .toFile(path.join(out, item.id + ".png"));
    manifest.push({
      id: item.id,
      pic,
      source: path.join(dir, file),
      output: "equipment/" + item.id + ".png",
    });
  }
  fs.writeFileSync(
    path.resolve(__dirname, "../source-assets/expedition-equipment-icons.json"),
    JSON.stringify(manifest, null, 2),
  );
}
main().then(()=>require('./build-equipment-art.cjs').main()).catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
