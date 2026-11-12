# 微信小游戏畅玩权益接入 · 1.0.294

2026-11-03，接入依据为微信官方 [畅玩权益文档](https://developers.weixin.qq.com/minigame/introduction/commercialization/ad/Benefits_for_Playing.html)（页面标注最后编辑于 2026-11-02）。

首页左侧新增「畅玩权益」入口，点击直接展示 `wx.createAdSkipCard().show()` 的官方购买页。游戏初始化时非阻塞预加载；失败不阻断启动，点击后可以重试。组件按平台共享一个适配器，重复点击合并请求；加载、展示、关闭、错误和使用事件都有对应的注销入口。`show.success` 只代表购买页已展示，最终结果等待 `onClose`。

兼容条件按官方文档为 Android 微信 8.0.68 及以上、基础库 3.17.2 及以上，同时要求组件 API 可用。不符合条件时隐藏入口，原激励广告流程照常工作。当前工程基础库配置为 3.17.3。商品、价格、权益有效期、平台日额度和核销都由微信管理；游戏不自建购买资格或本地免广告余额。文档所述主动核销 N 次接口尚未发布，本次没有仿造该接口，也没有添加付费关卡。

按用户提供的广告位 `adunit-169ed6b4a88c03ba`，同步将 `classic-config.js` 与 `classic.config.json` 的广告模式切换为 `wechat`。全部既有奖励入口继续调用共用 `RewardedAds` 端口。平台负责有效权益的自动跳过，游戏仍等待标准 `RewardedVideoAd.onClose` 的 `isEnded === true` 后提交原有奖励事务。`AdSkipCard.onClose(pay_success)` 仅显示购买结果；`onUse` 仅在内存记录平台观察值，二者都不增发道具或 VIP 积分。广告取消、加载失败、播放失败和缺少完成标记都不发奖。

广告适配器补齐同步创建/注册/播放异常的回收、一次加载重试、忙碌锁和重复回调保护。首次原生播放仍在用户点击调用栈执行。游戏奖励与 VIP 积分继续沿用已有原子事务及过期凭据校验。

配置与职责：

- `game/play/play-benefits-config.js`：功能开关、预加载开关、最低版本、支持平台、入口位置/样式、超时和文案。
- `game/play/play-benefits.js`：兼容检查、单例、原生事件及请求生命周期；不依赖游戏模型、存档或支付后端。
- `game/play/play-benefits-view.js`：首页入口和用户反馈；不参与发奖。
- `game/play/rewarded-ad-config.js`：广告提示文案；广告位与模式仍由 `classic-config` 注入。
- `game/play/boot.js`、`classic-view.js`：启动预加载及首页组合。

验收：

- `node --test tools/test-play-benefits.cjs tools/test-classic.cjs tools/test-activities.cjs tools/test-wechat-startup-283.cjs tools/test-solo-challenges.cjs tools/test-cloud-save-281.cjs`：覆盖兼容、重试、取消、重复回调和真实模型的奖励事务，日志见 `evidence/tests-1.0.294.log`。
- `node tools/build-wechat.cjs`：生成 `dist/wechat-1.0.294`，检查 AppID、资源和包体，日志见 `evidence/build-1.0.294.log`。
- `node tools/verify-wechat-babel.cjs dist/wechat-1.0.294`：生成包增强编译与 helper 运行校验。
- `node tools/run-play-benefits-runtime-qa.cjs`：真实微信模拟器与 Cocos 引擎、独立内存档；支持 Android 的平台信息、购买和广告事件明确使用桩，不能据此声称已发生真实购买或真实广告播放。检查默认模拟器隐藏入口、支持环境显示入口、取消/错误/成功、重复点击、一次性奖励与真实玩家状态未变。生成入口和临时探针在结束后恢复。
- `node tools/verify-play-benefits-release.cjs`：逐文件比较最终生成脚本与源码格式压缩结果，复核配置、包体且排除临时探针。

真实 Android 微信的官方购买页、支付、真实广告填充/播放、权益自动跳过及收益统计需由真机验证。不得将模拟回调、构建检查或开发上传作为这些行为的验收证据；开发上传也不代表体验版设置、审核或正式发布。

本轮结果：93 项相关测试通过，生成包增强编译检查、源码与产物一致性检查、包体检查及模拟器独立存档验收通过。微信官方 CLI 已将 `dist/wechat-1.0.294` 上传到 AppID `wx7a597ac02546773f` 的开发版本 1.0.294。微信上传回执记录主包 3,260,640 字节、总包 31,364,504 字节；本地构建大小与微信增强编译后大小分别保留。上传日志和回执为 `evidence/upload-1.0.294.log`、`evidence/upload-1.0.294-info.json`，汇总为 `evidence/verification-1.0.294.json`，模拟器报告与截图位于 `evidence/play-benefits-runtime-20261103045110186/`。

后续架构建议：将 `ClassicView.ad` 与 `SoloChallengeView.ad` 中重复的奖励事务、凭据过期和界面生命周期校验提取为可注入的共用奖励协调器，让远征与挑战共用一致的取消、重入和发奖规则。保持微信平台适配器仅返回完成结果，避免以后新增运营活动时将平台权益状态写入游戏经济模型。

可先抽取“当前请求仍有效”的校验与完成结果类型，再分别迁移两种视图的事务提交，保留独立内存档回归测试。购买组件继续只依赖平台端口；奖励协调器只依赖模型事务和完成结果。这样新增广告场景只需提供业务操作，不再复制平台回调、VIP 积分和视图重绘规则，也便于以后增加服务端核验。
