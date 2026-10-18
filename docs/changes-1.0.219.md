# 1.0.219 张飞物理定位与丈八蛇矛

张飞原名册沿用法术攻击标记，导致物理攻击装备不增加面板、法攻装备被推荐。现在通过统一 hero-damage-config 覆盖所有阶级及远征/多人名册：普攻物理、装备仅接受 physicalAttack；既有技能明确指定的真实伤害保留。推荐自动跟随实际装备收益，丈八蛇矛只推荐张飞。

保留7005存档ID、进阶等级、碎片、品质、解锁条件及基础效果。雌雄双股剑更名为丈八蛇矛，更新主题、运行配置、图鉴、章节进阶预告和典故。增加独立专属兵器归属配置，详情明确显示“张飞专属武器”。归属与额外技能设计分开，不凭空添加专属触发数值。

图标使用内置imagegen，以原装备图的绘制风格为参考，生成单柄蛇形刃长矛。源文件 source-assets/equipment-art/7005-zhangba.png；运行资源 game/skin-assets/equipment/7005.png；同步构建覆盖配置与来源清单。原图源文件保留。

最终提示词：Replace the two swords in this game equipment icon with exactly ONE Zhang Fei's Zhangba Snake Spear (丈八蛇矛). Keep the same premium painted Chinese Three Kingdoms fantasy equipment icon style and charcoal dark background. A single long dark iron shaft diagonally from bottom-left to top-right, with a large unmistakable sinuous serpentine silver spear blade, sharp wavy S-curved cutting edges tapering to a lethal pointed tip, dark steel and restrained bronze fittings, a small dark red tassel beneath the spearhead. Heavy martial physical weapon, not magical. Whole weapon entirely visible, strong readable silhouette for a small square icon. No swords, no paired weapons, no text, no labels, no frame, no human, no glowing magic. Square composition, detailed polished metal matching reference rendering.

新增回归检查张飞全阶攻击类型、物理装备真实面板收益、法系推荐排除、实战抗性结算、原技能真实伤害、武器专属归属与存档ID兼容。同步更新旧测试中张飞从法攻装备获得加成的过期断言。

架构建议：继续把推荐匹配建立在实际属性收益上，将英雄主属性、攻击伤害类型、技能指定伤害类型分别建模；专属兵器归属独立于额外技能，避免新增归属必须虚构技能。装备名称仍存在主题与章节预告的重复配置，后续可改成按ID查询统一展示元数据，减少改名遗漏。

交付验证：768项全量测试通过，22项发布模型检查通过。最终发布图鉴名称及专属归属通过验证，按release-config别名核对并查看equipment/7005.jpg，确认为蛇矛图标（发布构建将PNG压为JPEG）。构建主包3000326字节、总包30924167字节，均在预算内。微信开发版1.0.219上传成功，CLI退出码0，日志包含 √ upload；AppID wx7a597ac02546773f。日志 evidence/upload-1.0.219.log，回执 evidence/upload-1.0.219-info.json。未进行真机验收，开发上传不代表审核或正式发布。
