"use strict";
const test = require("node:test"),
  assert = require("node:assert/strict");
const { unitLayout, bodyHeightRatio } = require("../game/play/unit-layout"),
  appearance = require("../game/play/battle-appearance"),
  c = require("../game/play/battle-hud-config").unit;
test("17套模型所有朝向的可见中心对齐格心，头顶信息紧贴人物且不随镜像翻转", () => {
  for (const [heroId, { assetKey }] of Object.entries(appearance.models)) {
    const manifest = require(
      "../game/skin-assets/" + assetKey + "-manifest.json",
    );
    for (const facing of appearance.directions)
      for (const scale of [0.85, 0.64]) {
        const source =
            manifest.anchors[appearance.mirrored[facing] || facing].height *
            manifest.scale,
          h = c.modelHeight * scale,
          l = unitLayout(manifest, facing, scale, true, heroId);
        assert(
          Math.abs(
            source * bodyHeightRatio(heroId,facing) * l.modelScale - h,
          ) < 0.001,
        );
        assert(Math.abs(l.bodyY + h / 2) < 0.001);
        assert(Math.abs(l.headY - h / 2 - c.headGap) < 0.001);
      }
  }
});
test("阶级与血条不重叠，三件装备在紧凑信息区内并与血条分层", () => {
  assert(c.rankX + c.rankSize / 2 < c.barX - c.barWidth / 2 - c.border);
  assert(c.equipmentY - c.equipmentSize / 2 > c.barHeight / 2 + c.border);
  assert(c.equipmentGap >= c.equipmentSize);
  assert(c.equipmentGap + c.equipmentSize / 2 < 50);
});
