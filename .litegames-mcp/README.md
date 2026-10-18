# LiteGames MCP 托管接入目录

本目录只保存 AI 自动接入的无密钥 scaffold、能力清单和所有权声明。游戏业务文件不会被自动覆盖；服务端 AppSecret、API Key、HMAC Key 和私钥不得放入游戏端。

- `ownership.json`：机器所有权声明。
- `integration-plan.json`：SDK、功能和公开服务地址。
- `src/litegames.generated.js`：可由游戏端显式导入的生成配置。
