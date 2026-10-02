/** 仅用于当前工程调试：off 原样运行，record 录制，replay 本地回放。 */
module.exports = {
  mode: 'replay',
  directory: 'traffic-recordings',
  maxBytes: 64 * 1024 * 1024,
  captureLogin: true,
  captureHttp: true,
  captureSockets: true,
  ignoredUrlPrefixes: ['http://usr/', 'https://cdnzzq.123slg.com/'],
  replayFile: 'replay-data/official-replay.txt',
  replaySpeed: 1,
  maxReplayDelayMs: 3000,
  // protocol 校验协议号和消息体；exact 校验整帧；sequence 只校验发送顺序。
  socketMatch: 'protocol',
  // 原版协议头；仅本地启动握手放宽内容匹配，玩法请求必须匹配消息体。
  socketProtocol: {
    headerLength: 16,
    commandOffset: 12,
    ignoredHeaderRanges: [[4, 12]],
    commandOnly: [1001, 6007],
    heartbeat: { request: 6033, response: 6034 },
  },
  // 仅移除显式列出的 HTTP JSON 字段与 URL 查询参数，例如时间戳。
  ignoredRequestFields: [],
  ignoredQueryParameters: [],
};
