# 1.0.282 体验版原生启动页排查

用户已确认体验版1.0.282，Android/iOS/电脑入口均报告停在微信原生加载页。与先前游戏内98%的域名阻塞不同，尚未拿到设备首帧前的错误。

对照1.0.281和1.0.282已生成目录，实际代码差异为版本号与难度相关模块，未改变引擎、WASM和美术资源。分包入口及WASM文件均存在。这些检查不能替代设备执行证明。

排查中发现源工程及本地发布目录的project.config.json曾被工具简化为仅appid（时间晚于1.0.282上传时间），已按保留的1.0.281有效工程描述恢复小游戏类型及编译配置，并保留最小配置备份。此本地描述恢复不能证明修复了已上传体验包。

已用同一1.0.282准备Android真机调试二维码，等待用户扫码以捕获真实设备错误。未清空用户档、未重抽难度、未盲改引擎或提前声明真机修复完成。

## 2026-10-31 真机堆栈定位与 1.0.283 修复

用户提供 iPhone 调试错误：`TypeError: o is not a function`。调用链为 `@babel/runtime/helpers/typeof.js → toPrimitive.js → toPropertyKey.js → defineProperty.js → _objectSpread2 → play/expedition-config.js`。错误发生在游戏配置加载阶段，早于自定义首屏和账号/云存档请求。`reportUserBehavior:ok` 是另一条成功回执，不能当作本次崩溃原因。

根因：工程启用 ES6/增强编译，同时将包内已经编译过的 `@babel/runtime` 当作业务文件再次编译。用相同目标环境（Chrome 53 / iOS 8）、Babel 7.21 runtime 转换规则可复现：`typeof.js` 被注入对自身的导入；首次对象展开经过 `defineProperty` 调用类型判断时，循环依赖获得尚未完成的导出，从而报 `not a function`。仅在 Node 或模拟器执行原始源文件无法覆盖这条发布转换链。

修复：源工程与发布工程的 `setting.babelSetting.ignore` 加入 `@babel/runtime/*`，保留业务文件的 ES6/增强编译。`tools/wechat-release.config.json` 新增 `projectPolicy`，集中维护 AppID、小游戏类型及运行库排除规则；`tools/wechat-project-policy.cjs` 在构建开始前拒绝损坏的工程配置，构建结束再次校验。未改动战斗数值或玩家存档。

回归验证：新增 `tools/test-wechat-startup-283.cjs`，旧配置能稳定复现 `not a function`，新配置通过对象展开、Symbol、属性键转换和实际远征配置加载。新发布副本加载26个模块、22个模型配置及38件装备配置，无 helper 自导入。940项测试、22项发布模型检查通过。证据位于 `evidence/tests-1.0.283.txt`、`evidence/babel-startup-1.0.283.json` 和 `evidence/build-1.0.283.txt`。

复验工具依赖安装：`npm ci --prefix tools/wechat-babel-qa --ignore-scripts`；执行 `node tools/verify-wechat-babel.cjs dist/wechat-1.0.283`。该工具覆盖导致本次崩溃的转换与配置加载链，不替代完整微信设备运行。

iPhone 调试码切换过程中电脑自动操作被 Esc 中止，未继续操作后台体验版。修复版开发上传与体验版切换、手机启动验收分别记录；仍需将体验版切至新版本并扫码确认。

1.0.283 开发上传已成功（CLI `√ upload`），回执 `evidence/upload-1.0.283.txt`、`evidence/upload-1.0.283-info.json`。上传后工程配置仍保留运行库排除项。为减少后台切换操作，另外生成修复版普通预览码供 iPhone/Android 直接扫码验证；普通预览码与远程调试码不同，不会自动提供远程调试日志。真机启动是否成功仍以用户扫码结果为准。

最终设备验证：用户已用 iPhone 扫描新生成的 `evidence/preview-1.0.283.png`，明确回复“能进入首页”。因此，本次 iPhone 启动修复已获得用户设备验证；Android、电脑微信及后台体验版切换仍未验证/执行，不扩大此验收结论。
