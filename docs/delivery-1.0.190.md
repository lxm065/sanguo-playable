# 1.0.190 开发版交付

武将上阵羁绊反馈已接入，使用原版 bone21 Spine 和纹理。

- 回归测试：684/684。
- 发布模型验证：22 项通过。
- 包体：主包 2,960,948 字节；总包 30,875,377 字节。
- 官方 CLI 上传退出 0，AppID wx7a597ac02546773f，日志确认 √ upload。
- 上传目标：dist/wechat-1.0.190。
- 回执：evidence/upload-1.0.190-info.json。
- 日志：evidence/upload-1.0.190.log。
- 原版资源哈希：evidence/original-bond-sources.json。
- 引擎解析及轨道验证：evidence/bond-trigger-runtime.json；隔离场景恢复后原状态和玩家存档一致。

模拟器帧循环未自动推进，受控推进验证了动画轨道，但没有完成动态画面验收。真机效果待确认。本次为微信开发版上传。
