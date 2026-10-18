# 1.0.149 排行榜视觉更新

- 全服榜和微信好友榜采用水墨山河、卷轴、红金页签与底部旗帜。
- 前三名使用金银铜徽章，头像圆形裁切，保留真实分数、分页、授权及双向切换。
- 视觉参数集中在 rank-theme-config.js；交互控件共用 rank-theme.js。开放域继续独立读取好友资料。
- 建议后续将主域与开放域的表格视觉配置进一步统一生成，减少两种渲染器样式漂移。

## 验证
- 排行榜专项 19/19 通过，发布模型 22/22 验证通过。
- 模拟器确认新底图加载、双向切换、好友榜生命周期清理。
- 完整回归 601 项，593 通过，8 项战斗难度断言失败，详见 evidence/tests-1.0.149.log；本次未修改战斗规则或相关测试。
- 发布包主包 2786355 字节，总包 30251164 字节，通过 4 MiB / 30 MiB 门槛。
- 模拟器截图：evidence/rank-global-149.jpg、evidence/rank-friend-149.jpg。

## 美术来源
按用户提供参考图使用 imagegen 生成空白水墨卷轴背景，动态行、页签和操作按钮由程序绘制。
生成原图：D:/codex/generated_images/01a1110a-9ad4-7f01-b5bb-c694d6ec1b24/exec-3d53be76-244a-4f11-a696-06efb5bbeb80.png
包内图片：game/skin-assets/rank-scroll.jpg（720×1280，JPEG）。
`n开发版上传：CLI exit 0、√ upload；回执 evidence/upload-1.0.149-info.json。未提交审核或发布正式版。
