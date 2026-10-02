# 从配置读取开发者工具路径，打开独立样板工程。
$ErrorActionPreference = 'Stop'
$sampleEnvironment = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'local.environment.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$sampleCli = Join-Path $sampleEnvironment.wechatHome 'cli.bat'
$sampleProject = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '../game'))
if (-not (Test-Path -LiteralPath $sampleCli)) { throw '请先更新 tools/local.environment.json 中的 wechatHome。' }
& $sampleCli open --project $sampleProject
