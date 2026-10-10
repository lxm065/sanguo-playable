# 1.0.115 变更

- 赤兔急行军：持续3秒，冷却15秒，开局触发；加速幅度不变。事件时长与头顶特效读取同一配置。
- 专属说明统一为“武将专属技能【技能名】：简短效果”；删除“其他武将仅获得基础属性”，不展示详细数值。
- 青龙偃月刀增加关羽专属：仅关羽触发溅射，其他武将仍可穿戴并获得属性。
- 双铁戟实际图标 game/skin-assets/equipment/7002.png 已替换为两柄交叉铁戟；旧锤图保存在 source-assets/equipment-1.0.115/7002-before.png。
- 自动测试520项通过，包含专属格式、赤兔3秒/15秒周期、关羽专属名单与溅射。
- 本次未进行手机真机验收。

## 美术来源

使用 imagegen 技能和内置 image_gen 编辑，参考旧7002图标。生成原图：D:/codex/generated_images/01a0f5e1-702f-7e00-b060-8258f9170cdf/exec-1701a19a-9b9d-4212-8d92-8aa3ae1d77d5.png。

完整提示词：

Edit target equipment icon. Replace the hammer entirely with Dian Wei's twin iron ji halberds (双铁戟): exactly two stout ancient Chinese short-shaft steel halberds crossing diagonally, each clearly has a pointed spear tip and a side crescent cutting blade, hefty dark forged iron, sharp silver edges, restrained bronze fittings and red leather grips. No hammer heads. Keep reference's high-quality painted game-item rendering and dark charcoal gradient square background, centered large readable silhouette, whole weapons visible with small margins. No text, letters, numbers, frame or characters. This will be a small inventory icon in a realistic Three Kingdoms game.

## 架构

专属身份、简洁展示文案和战斗数值分开配置，统一说明由共享函数生成。后续添加装备应同时维护这三类数据并通过配置完整性测试，避免更名、图标、触发资格分叉。
