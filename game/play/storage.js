'use strict';
/** 微信本地存储端口；写新快照前保留上一份可恢复副本。 */
function storage(wxApi,config,onSaved,beforeSave){return {
 /** 在领域变更前校验会话租约；普通离线测试端口仍可省略此钩子。 */
 assertWritable(){beforeSave?.();},
 /** 只读取本地版专用键，不读取或迁移原游戏账号。 */
 read(){
  const primary=wxApi.getStorageSync(config.storageKey),backup=wxApi.getStorageSync(config.storageBackupKey);
  let error;
  for(const text of [primary,backup]){
   if(!text)continue;
   try{const value=JSON.parse(text);if(config.validateSnapshot)config.validateSnapshot(value);if(text!==primary){if(primary)wxApi.setStorageSync(config.storageCorruptKey,primary);wxApi.setStorageSync(config.storageKey,text);}return value;}catch(e){error=e;}
  }
  if(error)throw error;
  return null;
 },
 /** 写入失败抛错，由领域事务恢复内存；不假报保存成功。 */
 write(value){this.assertWritable();const old=wxApi.getStorageSync(config.storageKey);if(old)wxApi.setStorageSync(config.storageBackupKey,old);wxApi.setStorageSync(config.storageKey,JSON.stringify(value));try{onSaved?.(value);}catch(e){console.warn('成绩同步暂不可用');}},
};}
module.exports={storage};
