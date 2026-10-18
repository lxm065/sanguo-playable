# 1.0.217 周瑜破军令图标透明化

周瑜破军令强化友军时，头顶图标改为透明背景红金图案，去除黑色方底和外框。独立配置 visual.strategyIcon 指向 game/skin-assets/effects/strategy-bloodlust-transparent.png，尺寸和位置不变，技能增伤及消费逻辑不变。

使用内置 imagegen 编辑原图，生成原件保存在 D:/codex/generated_images/01a129df-70f6-7231-a515-54653cfb3616/exec-c97193a5-f5c9-43aa-b700-5035194318fa.png。游戏使用128×128 PNG。检查确认16384像素中8704个像素完全透明，角落alpha为0。

最终提示词：Edit this exact small game buff icon into a transparent-background cutout. Preserve the central red and golden yellow bloodlust emblem silhouette, its angular painted shapes and colors, as closely as possible. Remove all black square background and all outer square metallic border completely, leaving only the red-and-gold emblem floating on true transparent alpha. No new elements, no text, no shadows, no backdrop. Center emblem with tight modest transparent padding. This will be displayed as a 42px buff icon above a game character.

验证：现有专属武器及典韦相关16项测试通过；素材透明通道通过检查。未进行真机视觉验收。

架构说明：通过独立图标配置隔离各增益的显示素材，避免共享素材改动影响其他技能；本次不需要扩大重构范围。

交付：1.0.217开发上传成功，退出码0且日志包含 √ upload。构建主包2999412字节、总包30925700字节，包体检查通过。发布目录中图标透明度检查通过。AppID wx7a597ac02546773f。日志 evidence/upload-1.0.217.log；回执 evidence/upload-1.0.217-info.json。开发上传不代表真机验收、审核或正式发布。
