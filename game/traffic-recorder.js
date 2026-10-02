const binary = require('./traffic-binary');
/** 安装透明录制或本地回放；record 不修改接口内容或原验证流程。 */
function install(wxApi, config) {
  if (config.mode === 'off' || wxApi.__trafficRecorderInstalled) return;
  if (!['record', 'replay'].includes(config.mode)) throw new Error('Invalid traffic recorder mode');
  if (!['exact', 'sequence', 'protocol'].includes(config.socketMatch) || !(config.replaySpeed > 0)) throw new Error('回放匹配方式或速度配置无效');
  const fs = wxApi.getFileSystemManager();
  const started = Date.now();
  let nextId = 0, bytes = 0, stopped = false;
  const directory = wxApi.env.USER_DATA_PATH + '/' + config.directory;
  const path = directory + '/session-' + started + '.jsonl';

  /** 无损保存二进制帧，普通 JSON 不改变字段类型。 */
  function encode(value) {
    if (value instanceof ArrayBuffer || ArrayBuffer.isView(value)) {
      const data = value instanceof ArrayBuffer ? value : value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength);
      return { __trafficBinary: binary.toBase64(data) };
    }
    if (value instanceof Error) return { name: value.name, message: value.message };
    if (Array.isArray(value)) return value.map(encode);
    if (value && typeof value === 'object') {
      const result = {};
      for (const key of Object.keys(value)) if (typeof value[key] !== 'function' && value[key] !== undefined) result[key] = encode(value[key]);
      return result;
    }
    return value;
  }

  /** 将录制的二进制字段恢复为微信 WebSocket 接口使用的 ArrayBuffer。 */
  function decode(value) {
    if (value && typeof value === 'object' && Object.keys(value).length === 1 && typeof value.__trafficBinary === 'string') return binary.fromBase64(value.__trafficBinary);
    if (Array.isArray(value)) return value.map(decode);
    if (value && typeof value === 'object') {
      const result = {};
      for (const key of Object.keys(value)) result[key] = decode(value[key]);
      return result;
    }
    return value;
  }

  /** 录制失败只停止日志，不中断原游戏请求。 */
  function write(type, id, data) {
    if (stopped) return;
    try {
      const line = JSON.stringify({ type, id, ms: Date.now() - started, data: encode(data) }) + '\n';
      const size = unescape(encodeURIComponent(line)).length;
      if (bytes + size > config.maxBytes) throw new Error('录制大小达到配置上限');
      fs.appendFileSync(path, line, 'utf8');
      bytes += size;
    } catch (error) {
      stopped = true;
      console.warn('[traffic-recorder] 录制已停止，原游戏继续运行：' + error.message);
    }
  }

  /** 资源和缓存请求可跳过，接口请求默认保留。 */
  function ignored(url) { return config.ignoredUrlPrefixes.some(prefix => String(url || '').startsWith(prefix)); }

  /** 捕获一次 HTTP 或平台登录操作，保留原任务和回调行为。 */
  function recordCall(name) {
    const original = wxApi[name];
    wxApi[name] = function recordedCall(options = {}) {
      if (name === 'request' && ignored(options.url)) return original.call(wxApi, options);
      const id = ++nextId;
      write(name + '.request', id, options);
      const wrapped = { ...options };
      for (const callback of ['success', 'fail']) {
        wrapped[callback] = function recordedResult(result) {
          write(name + '.' + callback, id, result);
          if (options[callback]) options[callback](result);
        };
      }
      return original.call(wxApi, wrapped);
    };
  }

  /** 同时捕获发送帧、服务器推送和连接状态，不重写协议。 */
  function recordSockets() {
    const original = wxApi.connectSocket;
    wxApi.connectSocket = function recordedConnect(options) {
      const id = ++nextId;
      write('socket.connect', id, options);
      const task = original.call(wxApi, options);
      for (const event of ['Open', 'Message', 'Error', 'Close']) {
        task['on' + event](function recordedSocketEvent(data) { write('socket.' + event.toLowerCase(), id, data); });
      }
      const send = task.send;
      task.send = function recordedSend(options) {
        write('socket.send', id, { data: options.data });
        return send.call(task, options);
      };
      return task;
    };
  }

  if (config.mode === 'record') {
    try {
      try { fs.accessSync(directory); } catch (_) { fs.mkdirSync(directory, true); }
      fs.writeFileSync(path, '', 'utf8');
    } catch (error) { console.warn('[traffic-recorder] 无法创建录制文件：' + error.message); return; }
    write('session', 0, { version: 1, started, mode: 'record' });
    if (config.captureLogin) recordCall('login');
    if (config.captureHttp) recordCall('request');
    if (config.captureSockets) recordSockets();
    // 只暴露文件位置，不把登录响应和凭据打印进控制台。
    console.info('[traffic-recorder] recording file: ' + path);
  } else {
    if (!config.replayFile) throw new Error('请先在 traffic-recorder.config.js 指定真实录制文件 replayFile');
    const events = fs.readFileSync(config.replayFile, 'utf8').trim().split(/\r?\n/).map(line => JSON.parse(line));
    if (!events[0] || events[0].type !== 'session' || events[0].data.version !== 1) throw new Error('不支持的录制文件格式');
    const used = new Set();

    /** 排序 JSON 键后匹配，不受对象键插入顺序影响。 */
    function stable(value) {
      if (Array.isArray(value)) return value.map(stable);
      if (value && typeof value === 'object') return Object.keys(value).sort().reduce((result, key) => { result[key] = stable(value[key]); return result; }, {});
      return value;
    }

    /** 只忽略配置指定的易变字段，避免匹配到无关请求。 */
    function signature(name, value) {
      const data = encode(value);
      if (name === 'login') return 'login';
      let url = String(data.url || '');
      const question = url.indexOf('?');
      if (question >= 0) {
        const query = url.slice(question + 1).split('&').filter(part => !config.ignoredQueryParameters.includes(decodeURIComponent(part.split('=')[0]))).sort();
        url = url.slice(0, question) + (query.length ? '?' + query.join('&') : '');
      }
      let body = data.data;
      if (typeof body === 'string') { try { body = JSON.parse(body); } catch (_) {} }
      if (body && typeof body === 'object') {
        body = { ...body };
        for (const key of config.ignoredRequestFields) delete body[key];
      }
      return JSON.stringify(stable({ url, method: String(data.method || 'GET').toUpperCase(), body }));
    }

    /** 回放缺失显式失败，绝不自动请求线上服务器补结果。 */
    function failed(options, message) {
      const result = { errMsg: 'replay:fail ' + message };
      console.warn('[traffic-recorder] ' + result.errMsg);
      setTimeout(() => { if (options.fail) options.fail(result); if (options.complete) options.complete(result); }, 0);
    }

    /** 根据真实请求匹配录制响应，并模拟异步任务取消。 */
    function replayCall(name) {
      wxApi[name] = function replayedCall(options = {}) {
        const match = events.find(e => e.type === name + '.request' && !used.has(e.id) && signature(name, e.data) === signature(name, options));
        let timer;
        const task = { abort() { clearTimeout(timer); }, onHeadersReceived() {}, offHeadersReceived() {} };
        if (!match) { failed(options, '没有匹配的 ' + name + ' 录制'); return task; }
        used.add(match.id);
        const response = events.find(e => e.id === match.id && [name + '.success', name + '.fail'].includes(e.type));
        if (!response) { failed(options, '该请求没有录到响应'); return task; }
        timer = setTimeout(() => {
          const value = decode(response.data), callback = response.type.endsWith('.success') ? options.success : options.fail;
          console.info('[traffic-recorder] replay hit: ' + name + ' #' + match.id + ' ' + response.type);
          if (callback) callback(value);
          if (options.complete) options.complete(value);
        }, Math.min(config.maxReplayDelayMs, Math.max(0, response.ms - match.ms) / config.replaySpeed));
        return task;
      };
    }

    /** WebSocket 按原时序推送，并在下一个客户端发送帧处等待。 */
    function replaySockets() {
      wxApi.connectSocket = function replayedConnect(options) {
        const match = events.find(e => e.type === 'socket.connect' && !used.has(e.id) && e.data.url === options.url);
        const handlers = { Open: [], Message: [], Error: [], Close: [] };
        const task = {};
        const protocol = config.socketMatch === 'protocol' ? config.socketProtocol : null;
        /** 仅从已配置的原版包头读取协议号。 */
        function command(data) {
          if (!protocol) return null;
          const bytes = new Uint8Array(data);
          return bytes.length >= protocol.headerLength ? new DataView(bytes.buffer).getUint16(protocol.commandOffset) : null;
        }
        /** 登录易变字段按配置放宽；玩法请求仍校验原始消息体。 */
        function matches(actual, expected) {
          if (config.socketMatch === 'sequence') return true;
          if (config.socketMatch === 'exact') return JSON.stringify(encode(actual)) === JSON.stringify(expected);
          const saved = binary.fromBase64(expected.__trafficBinary);
          const id = command(actual);
          if (id === null || id !== command(saved)) return false;
          if (protocol.commandOnly.includes(id)) return true;
          const a = new Uint8Array(actual), b = new Uint8Array(saved);
          return a.length === b.length && a.every((v, i) => protocol.ignoredHeaderRanges.some(([start, end]) => i >= start && i < end) || v === b[i]);
        }
        let heartbeatReply;
        let stream = [], index = 0, previous = match ? match.ms : 0, timer = null, closed = false;
        /** 按注册顺序派发状态或二进制消息。 */
        function emit(name, value) { for (const callback of [...handlers[name]]) callback(value); }
        /** 推送服务器事件，遇到发送帧时保持因果顺序。 */
        function pump() {
          if (closed || timer !== null || index >= stream.length || stream[index].type === 'socket.send') return;
          const event = stream[index++];
          timer = setTimeout(() => {
            timer = null;
            previous = event.ms;
            const name = event.type.slice(7);
            emit(name[0].toUpperCase() + name.slice(1), decode(event.data));
            if (name === 'close') closed = true;
            pump();
          }, Math.min(config.maxReplayDelayMs, Math.max(0, event.ms - previous) / config.replaySpeed));
        }
        for (const name of Object.keys(handlers)) {
          task['on' + name] = function subscribe(callback) { handlers[name].push(callback); };
          task['off' + name] = function unsubscribe(callback) { handlers[name] = callback ? handlers[name].filter(fn => fn !== callback) : []; };
        }
        task.send = function replayedSend(options) {
          if (!closed && protocol && command(options.data) === protocol.heartbeat.request && heartbeatReply) {
            setTimeout(() => { if (!closed) emit('Message', decode(heartbeatReply.data)); }, 0);
            if (options.success) options.success({ errMsg: 'sendSocketMessage:ok' });
            if (options.complete) options.complete({ errMsg: 'sendSocketMessage:ok' });
            return;
          }
          const expected = stream[index];
          if (closed || !expected || expected.type !== 'socket.send' ||
            !matches(options.data, expected.data.data)) {
            failed(options, 'WebSocket 不匹配，当前 ' + command(options.data) + '，等待 ' + (expected && expected.data.data && expected.data.data.__trafficBinary ? command(binary.fromBase64(expected.data.data.__trafficBinary)) : '服务器事件/结束'));
            emit('Error', { errMsg: 'replay:fail WebSocket 发送帧不匹配' });
            return;
          }
          index++; previous = expected.ms;
          console.info('[traffic-recorder] socket replay hit: ' + command(options.data));
          if (options.success) options.success({ errMsg: 'sendSocketMessage:ok' });
          if (options.complete) options.complete({ errMsg: 'sendSocketMessage:ok' });
          pump();
        };
        task.close = function closeReplay(options = {}) {
          closed = true; clearTimeout(timer);
          if (options.success) options.success({});
          emit('Close', { code: options.code || 1000, reason: options.reason || '' });
        };
        if (!match) {
          failed(options, '没有匹配的 WebSocket 会话');
          setTimeout(() => emit('Error', { errMsg: 'replay:fail missing socket session' }), 0);
        } else {
          used.add(match.id);
          stream = events.filter(e => e.id === match.id && e.type.startsWith('socket.') && e !== match);
          if (protocol) {
            heartbeatReply = stream.find(e => e.type === 'socket.message' && command(binary.fromBase64(e.data.data.__trafficBinary)) === protocol.heartbeat.response);
            stream = stream.filter(e => !['socket.send', 'socket.message'].includes(e.type) || ![protocol.heartbeat.request, protocol.heartbeat.response].includes(command(binary.fromBase64(e.data.data.__trafficBinary))));
          }
          setTimeout(() => { if (options.success) options.success({}); pump(); }, 0);
        }
        return task;
      };
    }
    replayCall('login');
    replayCall('request');
    replaySockets();
    console.info('[traffic-recorder] local replay: ' + config.replayFile);
  }
  wxApi.__trafficRecorderInstalled = true;
}

module.exports = { install };
