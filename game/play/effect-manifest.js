'use strict';
/** 统一资源索引，原生模型特效与离线生成特效保留独立来源清单。 */
module.exports = { ...require('./native-effect-manifest'), ...require('./pixelfx-effect-manifest') };
