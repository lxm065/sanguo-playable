'use strict';
/** 微信本地存储端口；写新快照前保留上一份可恢复副本。 */
function storage(wxApi,config){return {
 /** 只读取本地版专用键，不读取或迁移原游戏账号。 */
 read(){const text=wxApi.getStorageSync(config.storageKey);return text?JSON.parse(text):null;},
 /** 写入失败抛错，由领域事务恢复内存；不假报保存成功。 */
 write(value){const old=wxApi.getStorageSync(config.storageKey);if(old)wxApi.setStorageSync(config.storageBackupKey,old);wxApi.setStorageSync(config.storageKey,JSON.stringify(value));},
};}
module.exports={storage};
