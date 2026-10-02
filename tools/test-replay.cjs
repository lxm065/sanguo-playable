const assert = require('node:assert/strict');
const fs = require('node:fs');
const { install } = require('../game/traffic-recorder');
const codec = require('../game/traffic-binary');
const config = require('../game/traffic-recorder.config');

/** 校验 Base64 与 Node 实现一致，包括不同长度和非法输入。 */
function testCodec() {
  for (let length = 0; length < 300; length++) {
    const bytes = Uint8Array.from({ length }, (_, i) => (i * 131 + length) & 255);
    const text = codec.toBase64(bytes.buffer);
    assert.equal(text, Buffer.from(bytes).toString('base64'));
    assert.deepEqual(new Uint8Array(codec.fromBase64(text)), bytes);
  }
  assert.throws(() => codec.fromBase64('???'));
}

/** 构造禁止真实联网的运行环境。 */
function environment(recording) {
  return { getFileSystemManager: () => ({ readFileSync: () => recording }), env: { USER_DATA_PATH: '/test' },
    request() { throw new Error('Unexpected network'); }, connectSocket() { throw new Error('Unexpected network'); }, login() { throw new Error('Unexpected platform login'); } };
}

/** 完整消费真实轨迹并逐字节核对所有非心跳响应，验证错误请求不会推进轨迹。 */
async function testRecording(file) {
  const recording = fs.readFileSync(file, 'utf8');
  const events = recording.trim().split('\n').map(JSON.parse);
  const connect = events.find(e => e.type === 'socket.connect');
  const stream = events.filter(e => e.id === connect.id && ['socket.send', 'socket.message'].includes(e.type) && ![6033, 6034].includes(e.command));
  const wx = environment(recording);
  install(wx, { ...config, mode: 'replay', replayFile: file, maxReplayDelayMs: 0 });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Full replay timeout')), 10000);
    const task = wx.connectSocket({ url: connect.data.url });
    let position = 0, rejectedMutation = false, settlements = 0;
    /** 按客户端发送边界继续推进，响应尚未到达时等待。 */
    function advance() {
      if (position === stream.length) {
        clearTimeout(timer); task.close(); assert.equal(settlements, 6); assert.equal(rejectedMutation, true); resolve(); return;
      }
      if (stream[position].type !== 'socket.send') return;
      const event = stream[position++];
      const bytes = codec.fromBase64(event.data.data.__trafficBinary);
      if (event.command === 6109 && !rejectedMutation) {
        const bad = bytes.slice(0); new Uint8Array(bad)[bad.byteLength - 1] ^= 1;
        task.send({ data: bad, fail: () => {} });
        rejectedMutation = true;
      }
      task.send({ data: bytes, fail: reject });
      setTimeout(advance, 1);
    }
    task.onOpen(advance);
    task.onMessage(message => {
      try {
        const expected = stream[position++];
        assert.equal(expected.type, 'socket.message');
        assert.equal(codec.toBase64(message.data), expected.data.data.__trafficBinary);
        if (expected.command === 6646) settlements++;
        setTimeout(advance, 1);
      } catch (error) { clearTimeout(timer); reject(error); }
    });
  });
}

/** 执行公开编解码检查和本机真实录制回归检查。 */
async function main() {
  testCodec();
  await testRecording(process.argv[2] || require('node:path').resolve(__dirname,'../game/replay-data/official-replay.txt'));
  console.log('PASS: Base64, complete recorded response equality, six settlements, reject changed gameplay body');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
