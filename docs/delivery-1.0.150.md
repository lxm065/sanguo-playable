# 1.0.150 开发版交付

已实现全部持有资源的最强合法阵容静态估算。详情见 changes-1.0.150.md。

- 全量测试：608 通过、0 失败，evidence/test-1.0.150.txt。
- 模型检查：22 个通过，evidence/model-check-1.0.150.txt。
- 构建总包：30,251,552 字节，主包 2,786,743 字节，低于 30 MiB / 4 MiB 门槛。
- 上传目录：dist/wechat-1.0.150；官方 CLI exit 0、√ upload；AppID wx7a597ac02546773f。
- CLI 上传体积 30,275,413 字节；回执 evidence/upload-1.0.150-info.json，日志 evidence/upload-1.0.150.txt。
- 本机只读评估性能：16 武将/16 装备约 272ms，30 武将/30 装备约 1024ms；缓存约 0.16ms。仅为当前主机测试，不代表手机耗时，详见 evidence/strongest-performance-1.0.150.json。
- 未进行本次真机验收、体验版设置、提审或正式发布。
- 旧局已有战力基准和已锁定敌阵保留。新基准在下一章或重开本章后的第二阶段首次开战生成，后续关卡仍只推进既有难度系数。
