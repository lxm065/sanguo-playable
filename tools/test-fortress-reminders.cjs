'use strict';
const test=require('node:test'),a=require('node:assert/strict'),r=require('../game/play/fortress-reminders'),c=require('../game/play/fortress-backend-config');
test('仅 accept 授权进入上传结果，拒绝与失败不授权',()=>{a.deepEqual(r.accepted({a:'accept',b:'reject'},{build:'a',chest:'b'}),['build']);a.deepEqual(r.accepted({a:'ban'},{build:'a'}),[]);});
test('首次建造、领取后、库存就绪分别生成正确到期与撤销时间',()=>{a.deepEqual(r.snapshot({build:{end:500}},{}),{build_at:500,chest_at:500});a.deepEqual(r.snapshot({level:1,ready:1,nextAt:700},{}),{build_at:0,chest_at:0});a.deepEqual(r.snapshot({level:1,ready:0,nextAt:700},{}),{build_at:0,chest_at:700});});
test('配置关闭时不触发登录或写存档',()=>{const previous=c.enabled;c.enabled=false;try{r.enqueue({model:{transact(){throw Error('unexpected')}}},{stateKey:'diamondMine'});}finally{c.enabled=previous;}});
test('订阅结果带稳定事件编号，失败回调不触发上报',()=>{let seen;require('../game/play/fortress-subscription').request({requestSubscribeMessage(arg){arg.success({a:'accept',b:'reject'});}},{templates:{build:'a',chest:'b'}},g=>seen=g);a.deepEqual(seen.accepted,['build']);a.match(seen.id,/^[A-Za-z0-9_-]{16,64}$/);});
test('仅允许指定后端两个POST接口，其他域名、方法和下载保持禁止',()=>{const {allowed}=require('../game/play/backend-network-policy'),p={...c,enabled:true};a.equal(allowed('request',{url:p.baseUrl+p.loginPath,method:'POST'},p),true);for(const [method,o]of [['request',{url:p.baseUrl+p.syncPath,method:'GET'}],['downloadFile',{url:p.baseUrl+p.syncPath,method:'POST'}],['request',{url:p.baseUrl+'.evil.com'+p.syncPath,method:'POST'}],['request',{url:p.baseUrl+'/admin/v1/',method:'POST'}]])a.equal(allowed(method,o,p),false);});

test('无待同步任务不发登录请求，有任务上传成功后才移除',async()=>{
 const progress={state:{fortressReminders:{}},model:{transact(fn){fn();}}};let logins=0,uploads=0;
 const api={login(o){logins++;o.success({code:'test-code'});},request(o){if(o.url.endsWith(c.loginPath)){o.success({statusCode:200,data:{code:'OK',data:{access_token:'test-token',expires_at:new Date(Date.now()+3600000).toISOString()}}});}else{uploads++;a.equal(o.header.Authorization,'Bearer test-token');o.success({statusCode:200,data:{code:'OK',data:{}}});}}};
 await r.flush(progress,api);a.equal(logins,0);
 progress.state.fortressReminders.diamondMine={building:'diamondMine',revision:1,build_at:0,chest_at:0,accepted:[]};
 await r.flush(progress,api);a.equal(logins,1);a.equal(uploads,1);a.deepEqual(progress.state.fortressReminders,{});
});
