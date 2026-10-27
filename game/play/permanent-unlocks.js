'use strict';
const config=require('./permanent-unlock-config');
/** 永久解锁与章节奖励分开保存，重新远征不会清除。 */
function has(meta,kind,id){return !!meta?.permanentUnlocks?.[kind]?.includes(id);}
/** 只接受服务器返回且在本地配置登记的权益，原子保存后再通知界面。 */
function apply(model,snapshot){
 if(!snapshot||!Array.isArray(snapshot.items)||snapshot.items.some(code=>!Object.hasOwn(config.items,code)))throw Error('invalid unlock snapshot');
 const next={heroes:[],lords:[]};
 for(const code of new Set(snapshot.items)){const entry=config.items[code];next[entry.kind].push(entry.id);}
 next.heroes.sort();next.lords.sort();
 const old=model.state.meta.permanentUnlocks||{heroes:[],lords:[]};
 const added=snapshot.items.filter(code=>{const e=config.items[code];return !has(model.state.meta,e.kind,e.id);});
 if(JSON.stringify(old)!==JSON.stringify(next))model.transact(()=>{model.state.meta.permanentUnlocks=next;});
 return [...new Set(added)];
}
/** 前台恢复时异步同步；失败保留已落盘权益，不阻塞战斗和合成。 */
function attach(model,api,onGranted=()=>{},request=require('./backend-session').request){
 let flight=null,last=0;
 const sync=()=>{if(!config.enabled)return Promise.resolve();if(flight)return flight;if(Date.now()-last<config.retryMs)return Promise.resolve();last=Date.now();
  flight=request(config.path,{},api).then(snapshot=>{const added=apply(model,snapshot);if(added.length)onGranted(added.map(code=>config.items[code].name));}).catch(()=>{}).finally(()=>{flight=null;});return flight;};
 api.onShow?.(sync);sync();return {sync};
}
module.exports={has,apply,attach};
