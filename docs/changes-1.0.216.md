# 1.0.216 关羽跳劈参考调整

参考本机 F:/LoL-Asset-Library/converted/Tryndamere/Characters_Tryndamere_Skins_Skin0.glb 中 tryndamere_crit（1.0667秒）。只读采样证据：evidence/tryndamere-crit-reference.png；可复现脚本 tools/inspect-tryndamere-crit.cjs。

将压身、跃起举刀、顶点停留、快速下劈、俯身保持与收势应用到关羽已有攻击帧，加入独立根骨姿态时间轴。保留关羽角色外观；这是参考动作节奏与姿态的适配，不是跨骨架逐骨重定向。动作参数集中在 guanyu-jump-config.js。下劈刀光随下降阶段播放，伤害命中前摇由0.36秒调整为0.52秒，55%真伤、范围和阵亡触发规则保持不变。整个动作0.832秒，受战斗倍速统一缩放。

验证：764项自动测试通过；21项相关测试覆盖命中时刻、姿态复位、死亡中断、连续触发及伤害。模型发布检查22项通过。配置驱动图集预览：evidence/guanyu-crit-poses-216.png；此图不含战场刀光，不代替真机验收。

架构建议：后续将动作阶段、命中标记和中断恢复收敛到可配置的动作控制器，避免补间时间轴和伤害前摇分别维护；当前改动已将视觉各阶段统一为命中时刻的比例。

交付：微信开发版1.0.216上传成功，CLI退出码0且日志包含 √ upload。AppID wx7a597ac02546773f，构建主包2999346字节、总包30916710字节，均符合配置预算。最终发布图集22项检查通过。上传日志 evidence/upload-1.0.216.log，回执 evidence/upload-1.0.216-info.json。此次仅开发上传，不代表真机验收、审核或生产发布。
