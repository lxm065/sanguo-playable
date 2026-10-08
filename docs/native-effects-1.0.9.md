# 1.0.9 原素材技能表现替换

## 范围
保留 1.0.8 前两章 11 名武将、44 项技能的本地触发、伤害、控制、冷却及被动规则。本轮只替换表现及资源加载，不改变技能数值。

## 原素材接入
从 D:/Games/Warcraft3/ExtractedAssets 的原始 MDX 与对应 BLP 依赖导出 18 套效果，包括 FrostNovaTarget、FreezingBreathTargetArt、BlizzardTarget、SearingArrowMissile、ColdArrowMissile、ArrowMissile、FlameStrike1、HolyBoltSpecialArt、DivineShieldTarget、DispelMagicTarget、BlinkCaster、SilenceTarget、WarStompCaster、CleaveDamageTarget、BloodLustTarget、DeathCoilSpecialArt、ManaFlareBoltImpact、RoarCaster。

原始模型中的几何动画、PRE2 粒子、RIBB 拖尾由现有 Warcraft 模型渲染器顺序演算，再烘焙为透明动画图集（128像素单帧、12帧/秒）。这不是在 Cocos 内运行魔兽粒子引擎，也不是 AI 生成或重新画的替代图形。原始特效按棋盘镜头采样；同类技能共享合适的原生效果，不宣称每个技能都有独占模型。

- 原始源模型、实际读取的贴图/地面依赖及 SHA256 记录在 source-assets/native-effects.json。
- 加法发光底板转换成直通透明，避免叠到棋盘后出现黑色方片。冻结实体与沉默图标保留原透明通道。
- skill-effects.js 不再调用 Graphics 绘制冰刺、盾形、光线等替代轮廓。
- 真实伤害事件播放命中特效；出手事件不提前显示伤害。冻结与状态动画跟随目标，冰封死亡/驱散后移除。
- 原火箭、冰箭、普通箭沿实际目标方向运动；帧动画与回放倍速同步。共用图集缓存，单一帧循环，上限36个节点，离场停止循环并销毁节点。
- 模型分辨率与动作帧保持不变。仅将两张无透明背景以同尺寸90质量JPEG输出，发布别名由构建配置管理，源PNG保留。

## 验证
- 152项测试通过；新增全部技能到真实模型动画映射、源模型依赖追溯、时间轴倍速与销毁测试。
- 21套武将发布图集的帧序、骨骼数据、边界和像素密度检查通过；发布源码同步检查通过。
- evidence/native-effects-sheet.jpg 为原素材导出效果预览（首批16套）；evidence/native-freeze-nova-109.jpg 为开发者工具显示证据。
- 模拟器使用不落盘隔离模型验收；原生动画并不替代战报中的伤害结算。
- 包体积30,636,196字节，主包2,357,809字节，未降低武将模型清晰度。

## 边界与后续优化
本轮选择已具备可靠MDX渲染与依赖解析链的魔兽争霸资源。WoW和LoL的粒子运行规则不同，本轮没有把它们的单张纹理冒充完整特效。

发布是微信开发版本，不是正式上线或手机性能验收。后续应按真机同屏技能峰值评估帧循环和纹理占用，再决定是否需要降低远处/低优先级粒子的更新频率；不应退回程序绘制的廉价替代效果。


最终画面复核：evidence/native-peak-109.jpg 为原生冰星动画峰值帧；已修正 SpriteFrame.originalSize，避免整张图集尺寸令效果缩小。
