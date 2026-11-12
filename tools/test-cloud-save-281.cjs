'use strict';
const test=require('node:test'),a=require('node:assert/strict');
const {CloudSave,stable,bytes,retryDelay}=require('../game/play/cloud-save'),{createSession}=require('../game/play/backend-session');
const rules=require('../game/play/config'),roster=require('../game/play/expedition-roster'),bootstrap=require('../game/play/cloud-save-bootstrap'),policy=require('../game/play/cloud-save-config');

/** 内存服务端模拟共享账号、CAS 和未知响应；真实数据库锁另由后端集成测试验证。 */
function server(){
 const s={remote:{exists:false,revision:0},tokens:new Map(),active:0,seq:0,offline:false,lose:false,commits:[],logins:[],heartbeat:0};
 /** 接收真实客户端请求格式，账号身份从令牌派生。 */
 s.request=function(options){
  if(s.offline){options.fail({});return;}
  const action=options.url.split('/').at(-1),body=structuredClone(options.data);
  const ok=data=>options.success({statusCode:200,data:{code:'OK',data:structuredClone(data)}});
  const fail=(statusCode,code)=>options.success({statusCode,data:{code}});
  if(action==='login'){
   s.logins.push(body);const prior=body.previous_access_token;
   if(prior&&s.tokens.get(prior)!==s.active){fail(401,'SESSION_REPLACED');return;}
   if(!prior)s.active=++s.seq;
   const token='token-'+s.active+'-'+s.logins.length;s.tokens.set(token,s.active);ok({access_token:token,expires_at:new Date(s.now()+3600000).toISOString(),player:{player_id:'1885'}});return;
  }
  const token=options.header.Authorization?.slice(7);
  if(!token||s.tokens.get(token)!==s.active){fail(401,'SESSION_REPLACED');return;}
  if(action==='read'){ok(s.remote);return;}
  if(action==='heartbeat'){s.heartbeat++;ok({player_id:'1885'});return;}
  if(action==='commit'){
   s.commits.push(body);
   if(s.remote.commit_id===body.commit_id){ok(s.remote);return;}
   if(body.base_revision!==s.remote.revision){fail(409,'CONFLICT');return;}
   s.remote={exists:true,revision:s.remote.revision+1,commit_id:body.commit_id,schema_version:body.schema_version,snapshot:body.snapshot};
   if(s.lose){s.lose=false;options.fail({});return;}ok(s.remote);return;
  }
  fail(404,'NOT_FOUND');
 };
 let now=1000000;s.now=()=>now;s.advance=value=>{now+=value;};return s;
}

/** 每台设备独立本地存储与会话，定时器受控，不读取真实玩家数据。 */
function device(s,seed,choose=async()=>{throw Error('unexpected conflict');}){
 const items=seed||new Map(),listeners={},timers=[];
 const api={getStorageSync:key=>items.get(key),setStorageSync(key,value){if(api.failKey===key)throw Error('disk');items.set(key,value);},login:o=>o.success({code:'fixture'}),request:s.request,onHide:fn=>{listeners.hide=fn;},onShow:fn=>{listeners.show=fn;},onNetworkStatusChange:fn=>{listeners.network=fn;},offNetworkStatusChange:fn=>{if(listeners.network===fn)delete listeners.network;},offHide:()=>{delete listeners.hide;},offShow:()=>{delete listeners.show;}};
 const session=createSession(undefined,{clock:s.now});
 const cloud=new CloudSave(api,rules,{session,clock:s.now,choose,normalize:value=>bootstrap.candidate(value,rules,roster),create:()=>bootstrap.candidate(null,rules,roster),schedule:(fn,delay)=>{timers.push({fn,delay});return timers.length;},cancel(id){if(timers[id-1])timers[id-1].cancelled=true;}});
 return {items,api,session,cloud,listeners,timers};
}

/** 从主档生成独立改动，确保提交中的快照不会被后续引用修改。 */
function change(d,gold){const value=d.cloud.local.read();value.gold=gold;d.cloud.local.write(value);return value;}

test('旧本地档首次导入云端，新设备恢复相同战役，主档与账号绑定',async()=>{
 const s=server(),d=device(s),old=bootstrap.candidate(null,rules,roster);old.gold=321;d.items.set(rules.storageKey,JSON.stringify(old));
 await d.cloud.prepare();await d.cloud.flush();a.equal(s.remote.revision,1);a.equal(s.remote.snapshot.profile.campaign.gold,321);
 const second=device(s);await second.cloud.prepare();a.equal(second.cloud.local.read().gold,321);a.equal(second.items.get(policy.ownerKey),'1885');a.equal(second.cloud.journal.dirty,false);
});

test('提交成功但响应丢失时保留编号，重进读回确认，不重复推进版本',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();s.lose=true;await a.rejects(d.cloud.flush());
 const pending=JSON.parse(d.items.get(policy.metadataKey+'.1885')).pending;a(pending);a.equal(s.remote.revision,1);
 const reload=device(s,d.items);await reload.cloud.prepare();await reload.cloud.flush();a.equal(s.remote.revision,1);a.equal(reload.cloud.journal.pending,null);a.equal(s.commits.length,1);
});

test('未知结果原编号重试且本机后续改动继续下一批提交',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();change(d,100);s.lose=true;await a.rejects(d.cloud.flush());
 const id=d.cloud.journal.pending.commit_id;a.equal(d.cloud.phase,'reconnecting');change(d,200);
 a.equal(await d.cloud.resume(),true);a.equal(s.remote.revision,2);a.equal(s.commits.at(-1).commit_id,id);
 a.equal(d.cloud.journal.dirty,true);await d.cloud.flush();a.equal(s.remote.revision,3);a.equal(s.remote.snapshot.profile.campaign.gold,200);
});

test('第二台登录后旧端心跳失效，事务变更前拦截，后台重试不抢回登录',async()=>{
 const s=server(),old=device(s);await old.cloud.prepare();await old.cloud.flush();
 const latest=device(s);await latest.cloud.prepare();change(latest,900);await latest.cloud.flush();
 a.equal(await old.cloud.resume(),false);a.equal(old.cloud.phase,'replaced');const logins=s.logins.length;
 a.throws(()=>change(old,999));await old.cloud.resume();await a.rejects(old.session.request(policy.path+'/heartbeat',{},old.api));
 a.equal(s.logins.length,logins);a.equal(s.remote.snapshot.profile.campaign.gold,900);
});

test('不同进度不自动覆盖，明确选择前两份已备份，可分别恢复云端和本机',async()=>{
 for(const choice of ['cloud','local']){
  const s=server(),first=device(s);await first.cloud.prepare();await first.cloud.flush();change(first,400);
  const second=device(s);await second.cloud.prepare();change(second,500);await second.cloud.flush();
  let prompted=0;const reload=device(s,first.items,async()=>{prompted++;a(first.items.has(policy.archiveKey+'.1885'));a.equal(s.remote.snapshot.profile.campaign.gold,500);return choice;});
  await reload.cloud.prepare();a.equal(prompted,1);a.equal(reload.cloud.local.read().gold,choice==='cloud'?500:400);await reload.cloud.flush();a.equal(s.remote.snapshot.profile.campaign.gold,choice==='cloud'?500:400);
 }
});

test('云端读取失败不新建空档、不清理旧数据，坏主档回退有效备份',async()=>{
 const s=server(),d=device(s);s.offline=true;await a.rejects(d.cloud.prepare());a.equal(d.items.has(rules.storageKey),false);
 s.offline=false;const value=bootstrap.candidate(null,rules,roster);value.gold=777;d.items.set(rules.storageKey,'{broken');d.items.set(rules.storageBackupKey,JSON.stringify(value));await d.cloud.prepare();a.equal(d.cloud.local.read().gold,777);a.equal(d.items.get(policy.corruptKey),'{broken');
});

test('双份本机坏档且无云档时明确失败，存在云档时安全恢复',async()=>{
 const s=server(),bad=device(s);bad.items.set(rules.storageKey,'{bad');bad.items.set(rules.storageBackupKey,'{bad-backup');await a.rejects(bad.cloud.prepare(),/暂无可恢复/);a.equal(bad.items.get(rules.storageKey),'{bad');
 const good=device(s);await good.cloud.prepare();await good.cloud.flush();const restored=device(s,bad.items);await restored.cloud.prepare();a(restored.cloud.local.read().meta);a.equal(restored.items.get(policy.corruptKey),'{bad');a(restored.items.has(policy.archiveKey+'.1885'));
});

test('会话租约过期和退到后台时拒绝修改，恢复前台须重新核验',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();d.cloud.start();d.listeners.hide();a.throws(()=>change(d,9));d.listeners.show();await new Promise(resolve=>setImmediate(resolve));a.equal(d.cloud.phase,'ready');change(d,10);s.advance(policy.leaseMs+1);a.throws(()=>change(d,11));a.equal(d.cloud.local.read().gold,10);a.equal(d.cloud.phase,'offline');
});

test('元数据写入失败保留已落盘主档，并阻止后续操作',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();d.api.failKey=policy.metadataKey+'.1885';change(d,333);a.equal(d.cloud.phase,'localError');a.equal(d.cloud.local.read().gold,333);a.throws(()=>change(d,444));
});

test('同机续期携带旧令牌，已撤销令牌和过期实例不自动新登录',async()=>{
 const s=server(),d=device(s);await d.session.login(d.api);s.advance(3600000-policy.refreshAheadMs+1);await d.session.login(d.api);a(s.logins.at(-1).previous_access_token);const count=s.logins.length;s.advance(3600001);await a.rejects(d.session.login(d.api));a.equal(s.logins.length,count);a.equal(d.session.locked(),'SESSION_EXPIRED');
});

test('事务权限在领域操作前校验，禁止先执行奖励副作用',()=>{
 const {Campaign}=require('../game/play/campaign');let calls=0;
 const m=new Campaign(rules,require('../game/play/roster'),{read:()=>null,write(){},assertWritable(){throw Error('locked');}});
 a.throws(()=>m.transact(()=>{calls++;}));a.equal(calls,0);
});

test('规范化比较保留大整数与数组顺序，UTF-8 限额按字节计算',()=>{
 a.equal(stable({b:[2,1],a:9007199254740991}),stable({a:9007199254740991,b:[2,1]}));a.notEqual(stable([1,2]),stable([2,1]));a.equal(bytes('A中😀'),8);
 const allowed=require('../game/play/backend-network-policy').allowed,base=require('../game/play/fortress-backend-config').baseUrl;
 for(const action of ['read','commit','heartbeat'])a.equal(allowed('request',{method:'POST',url:base+policy.path+'/'+action}),true);
 a.equal(allowed('request',{method:'POST',url:base+policy.path+'/anything'}),false);
});

test('在途提交保持原快照，提交期间的新操作进入下一版，不丢进度',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();change(d,100);
 let held;d.api.request=options=>{if(options.url.endsWith('/commit'))held=options;else s.request(options);};
 const flight=d.cloud.flush();await new Promise(resolve=>setImmediate(resolve));a(held);change(d,200);
 a.equal(held.data.snapshot.profile.campaign.gold,100);s.request(held);await flight;a.equal(s.remote.snapshot.profile.campaign.gold,100);a.equal(d.cloud.journal.dirty,true);
 d.api.request=s.request;await d.cloud.flush();a.equal(s.remote.snapshot.profile.campaign.gold,200);a.equal(d.cloud.journal.dirty,false);
});

test('已被顶号的旧端触发续期也不会转成首次登录',async()=>{
 const s=server(),first=device(s);await first.session.login(first.api);const second=device(s);await second.session.login(second.api);
 s.advance(3600000-policy.refreshAheadMs+1);await a.rejects(first.session.login(first.api));a.equal(first.session.locked(),'SESSION_REPLACED');a(s.logins.at(-1).previous_access_token);
 const count=s.logins.length;await a.rejects(first.session.login(first.api));a.equal(s.logins.length,count);
});

/** 极简画布端口只记录状态节点；玩家正在查看的奖励面板必须保持原对象。 */
function screen(cloud){
 const nodes=[],modals=[],panel={reward:'未领取'};
 cloud.api.showModal=options=>modals.push(options);
 const v={cloudSave:cloud,root:{},modal:panel,ui:{box(){const node={isValid:true,removeFromParent(){},destroy(){this.isValid=false;}};nodes.push(node);return node;},text(parent,text){parent.text=text;}}};
 return {v,nodes,modals,panel};
}

test('1.0.284 短时心跳失败静默重连，租约内本机继续保存，恢复后自动补交',async()=>{
 const s=server(),d=device(s),ui=require('../game/play/cloud-save-ui');await d.cloud.prepare();await d.cloud.flush();d.cloud.start();
 const view=screen(d.cloud);d.cloud.onState=()=>ui.update(view.v);s.offline=true;
 a.equal(await d.cloud.resume(),false);a.equal(d.cloud.phase,'reconnecting');change(d,123);
 a.equal(d.cloud.local.read().gold,123);a.equal(view.modals.length,0);a.equal(view.nodes.length,0);a.equal(view.v.modal,view.panel);
 s.offline=false;const timer=d.timers[d.cloud.retryTimer-1];await timer.fn();
 a.equal(d.cloud.phase,'ready');a.equal(s.remote.snapshot.profile.campaign.gold,123);a.equal(d.cloud.journal.dirty,false);a.equal(view.modals.length,0);a.equal(s.logins.length,1);
});

test('1.0.284 长断网仅显示小字，操作在副作用前暂停，联网事件自动恢复且不关闭奖励面板',async()=>{
 const s=server(),d=device(s),ui=require('../game/play/cloud-save-ui');await d.cloud.prepare();await d.cloud.flush();d.cloud.start();
 const view=screen(d.cloud);d.cloud.onState=()=>ui.update(view.v);s.offline=true;await d.cloud.resume();s.advance(policy.leaseMs+1);
 const {Expedition}=require('../game/play/expedition');let called=0;const m=new Expedition(rules,roster,d.cloud.local);
 let error;try{m.transact(()=>{called++;});}catch(value){error=value;}
 a.equal(error.code,'CLOUD_SYNC_WAIT');a.equal(called,0);a.equal(d.cloud.phase,'offline');a.equal(ui.handleError(view.v,error),true);
 a.equal(view.modals.length,0);a.equal(view.v.cloudIndicator.text,policy.text.paused);a.equal(view.v.modal,view.panel);
 s.offline=false;d.listeners.network({isConnected:true});await d.cloud.resuming;
 a.equal(d.cloud.phase,'ready');a.equal(view.v.cloudIndicator,null);a.equal(view.v.modal,view.panel);change(d,456);await d.cloud.flush();a.equal(s.remote.snapshot.profile.campaign.gold,456);
});

test('1.0.284 恢复定时器使用有界退避，重复故障不叠加，成功后清除退避',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();d.cloud.start();s.offline=true;
 for(let attempt=0;attempt<6;attempt++){
  if(!attempt)await d.cloud.resume();const id=d.cloud.retryTimer,entry=d.timers[id-1];a.equal(entry.delay,retryDelay(attempt));
  d.cloud.reconnect();a.equal(d.cloud.retryTimer,id);await entry.fn();
 }
 a.equal(d.timers[d.cloud.retryTimer-1].delay,policy.maxRetryMs);
 const pending=d.cloud.retryTimer;s.offline=false;await d.cloud.resume();a.equal(d.cloud.retryAttempt,0);a.equal(d.cloud.retryTimer,null);a.equal(d.timers[pending-1].cancelled,true);
});

test('1.0.284 网络事件与手动同步并发时只发一个心跳，不重复登录或提交',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();d.cloud.start();change(d,99);
 let held,count=0;d.api.request=options=>{if(options.url.endsWith('/heartbeat')){held=options;count++;}else s.request(options);};
 const first=d.cloud.resume();a.equal(first,d.cloud.resume());d.listeners.network({isConnected:true});await new Promise(resolve=>setImmediate(resolve));a.equal(count,1);
 s.request(held);a.equal(await first,true);a.equal(s.remote.snapshot.profile.campaign.gold,99);a.equal(s.logins.length,1);a.equal(s.remote.revision,2);
});

test('1.0.284 静默重连遇到顶号后永久停下，仅提醒一次且永不自动抢回',async()=>{
 const s=server(),old=device(s),ui=require('../game/play/cloud-save-ui');await old.cloud.prepare();await old.cloud.flush();old.cloud.start();const view=screen(old.cloud);old.cloud.onState=()=>ui.update(view.v);
 s.offline=true;await old.cloud.resume();change(old,888);s.offline=false;const other=device(s);await other.cloud.prepare();const count=s.logins.length;
 await old.cloud.resume();a.equal(old.cloud.phase,'replaced');a.equal(view.modals.length,1);view.modals[0].fail();ui.update(view.v);a.equal(view.modals.length,1);
 a.equal(old.cloud.retryTimer,null);await old.cloud.resume();a.equal(s.logins.length,count);a.throws(()=>change(old,999));a.notEqual(s.remote.snapshot.profile.campaign.gold,888);a.equal(old.cloud.local.read().gold,888);
});

test('1.0.284 重连提交遇到修订冲突时保留副本并停止，不能静默覆盖',async()=>{
 const s=server(),d=device(s),ui=require('../game/play/cloud-save-ui');await d.cloud.prepare();await d.cloud.flush();d.cloud.start();const view=screen(d.cloud);d.cloud.onState=()=>ui.update(view.v);
 change(d,700);s.remote.revision++;s.remote.snapshot.profile.campaign.gold=800;await a.rejects(d.cloud.flush());
 a.equal(d.cloud.phase,'conflict');a.equal(d.cloud.terminal,true);a.equal(view.modals.length,1);a(d.items.has(policy.archiveKey+'.1885'));a.equal(d.cloud.local.read().gold,700);a.equal(s.remote.snapshot.profile.campaign.gold,800);a.equal(d.cloud.retryTimer,null);
});

test('1.0.284 切后台前尽力提交，后台不重试，旧前台心跳不能解锁新前台',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();d.cloud.start();change(d,20);
 let held;d.api.request=options=>{if(options.url.endsWith('/heartbeat'))held=options;else s.request(options);};const flight=d.cloud.resume();await new Promise(resolve=>setImmediate(resolve));
 d.listeners.hide();await d.cloud.flush();a.equal(s.remote.snapshot.profile.campaign.gold,20);d.listeners.show();a.equal(d.cloud.phase,'checking');s.request(held);a.equal(await flight,false);
 a.throws(()=>change(d,30));a.equal(d.cloud.foregroundVerified,false);d.api.request=s.request;await d.cloud.resume();change(d,30);a.equal(d.cloud.local.read().gold,30);
});

test('1.0.284 释放时取消定时器及网络监听，迟到的心跳不再激活实例',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();d.cloud.start();let held;d.api.request=options=>{held=options;};
 const flight=d.cloud.resume();await new Promise(resolve=>setImmediate(resolve));const verified=d.cloud.lastVerified;d.cloud.dispose();s.advance(1000);s.request(held);a.equal(await flight,false);a.equal(d.cloud.lastVerified,verified);
 a.equal(d.listeners.network,undefined);a.equal(d.listeners.show,undefined);a.equal(d.listeners.hide,undefined);a(d.timers.every(timer=>timer.cancelled));
});

test('1.0.284 启动网络失败自动重试，核对完成前不新建或覆盖玩家档',async()=>{
 const s=server(),d=device(s);d.cloud.dispose();const saved=bootstrap.candidate(null,rules,roster);saved.gold=765;const raw=JSON.stringify(saved);d.items.set(rules.storageKey,raw);s.offline=true;
 let prompts=0,waits=0;d.api.showModal=()=>{prompts++;};const cloud=await bootstrap.initialize(d.api,rules,roster,{session:d.session,onStatus:text=>a.equal(text,policy.text.startupRetry),schedule(resolve,delay){a.equal(delay,policy.retryMs);a.equal(d.items.get(rules.storageKey),raw);waits++;s.offline=false;resolve();}});
 a.equal(waits,1);a.equal(prompts,0);a.equal(cloud.phase,'ready');a.equal(cloud.local.read().gold,765);cloud.dispose();
});

test('1.0.284 初始提交响应丢失自动确认，开场无需玩家点重试',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();s.lose=true;let prompts=0,waits=0;d.api.showModal=()=>{prompts++;};
 a.equal(await bootstrap.ready(d.api,d.cloud,{schedule(resolve){waits++;resolve();}}),true);a.equal(waits,1);a.equal(prompts,0);a.equal(d.cloud.journal.dirty,false);a.equal(s.remote.revision,1);a.equal(s.commits[0].commit_id,s.commits[1].commit_id);
});

test('1.0.284 宝藏等领域操作等待同步时保留当前界面，不重绘或弹通用提示',async()=>{
 const s=server(),d=device(s);await d.cloud.prepare();await d.cloud.flush();
 const {Expedition}=require('../game/play/expedition'),{ExpeditionView}=require('../game/play/expedition-view');
 const m=new Expedition(rules,roster,d.cloud.local);require('../game/play/classic-hooks').attach(m,roster);await d.cloud.flush();
 const view=screen(d.cloud);view.v.model=m;view.v.roster=roster;view.v.render=()=>a.fail('等待同步不能重绘当前奖励');view.v.notice=()=>a.fail('等待同步不能弹通用提示');s.advance(policy.leaseMs+1);let operations=0;
 ExpeditionView.prototype.act.call(view.v,()=>m.transact(()=>{operations++;}));a.equal(operations,0);a.equal(view.modals.length,0);a.equal(view.v.modal,view.panel);a(view.v.cloudIndicator);
});
