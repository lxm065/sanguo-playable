# 1.0.120 击杀播报统一
原因：首杀至五杀、胜负已由英雄联盟默认女声导出，而六至八杀仍为旧游戏 kill_6/7/8 文件，存在音色混用；旧横幅 Mega Kill、Ultra Kill 与英雄联盟事件不对应。

全部播报现通过 tools/battle-audio-import.config.json 从 F:/LoL-Asset-Library/audio/converted/en_US 配置导入：
- 首杀 835992869；双杀 655441407；三杀 457215657；四杀 688775583。
- 五杀 Penta Kill：177689956（用户指定）。
- 六杀 Dominating：268856538（目录内同套默认女声的 Dominating 事件；未找到 Mega Kill 事件）。
- 七杀 Godlike：172470563（用户指定）。
- 八杀及以上 Legendary / 超神：202559117（用户指定）。
- 胜利139054080、失败741535347保持同套默认女声。

统一64kbps/32000Hz单声道导出，保留源WAV和输出MP3哈希，事件与来源回执见 docs/battle-refinement/audio-sources.json。
连杀计数、8秒窗口、音频开始时同步横幅、胜利不显示横幅等行为均不变。原多杀来源归档 source-assets/multikill-audio-before-1.0.120.json。
验证：526项测试全部通过，包括来源、用户指定ID、输出哈希、语音文字映射、队列和封顶档位。
架构建议：继续让导入配置管理源ID、announcer-config管理运行时档位，借助回执校验连接两层，避免展示标题和素材来源各自漂移。
