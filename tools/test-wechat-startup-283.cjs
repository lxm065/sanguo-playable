'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const policy=require('./wechat-project-policy.cjs'),release=require('./wechat-release.config.json'),babel=require('./verify-wechat-babel.cjs');
const root=path.resolve(__dirname,'../game');

/** 构造缺少运行库隔离的旧发布配置，用真实 helper 验证首次对象展开会崩溃。 */
function oldProject(){return {appid:release.projectPolicy.appid,compileType:'game',setting:{es6:true,enhance:true,babelSetting:{ignore:[],disablePlugins:[],outputPath:''}}};}

test('旧发布设置可复现真机 typeof helper 的 not a function 错误',()=>{
 assert.throws(()=>babel.smoke(root,oldProject()),/not a function/);
});
test('隔离运行库后对象展开、Symbol 和属性键转换成功，业务代码仍增强编译',()=>{
 const project=policy.prepare(oldProject(),release.projectPolicy),result=babel.smoke(root,project);
 assert.equal(result.helperSelfImport,false);assert.equal(result.objectSpread.hp,100);assert.equal(result.objectSpread.attack,20);
 assert.equal(babel.ignored('play/expedition-config.js',project),false);
 assert.equal(project.setting.es6,true);assert.equal(project.setting.enhance,true);
});
test('发布策略保留现有编译选项、排除规则且不修改输入',()=>{
 const old=oldProject();old.setting.babelSetting.ignore=['vendor/*'];const before=JSON.stringify(old);
 const next=policy.prepare(old,release.projectPolicy);policy.verify(next,release.projectPolicy);
 assert.deepEqual(next.setting.babelSetting.ignore,['vendor/*','@babel/runtime/*']);assert.equal(JSON.stringify(old),before);
});
test('工程配置丢失类型或 AppID 错误时必须在构建前失败',()=>{
 assert.throws(()=>policy.prepare({appid:release.projectPolicy.appid},release.projectPolicy),/工程配置无效/);
 assert.throws(()=>policy.prepare({...oldProject(),appid:'wrong'},release.projectPolicy),/工程配置无效/);
 assert.throws(()=>policy.verify(oldProject(),release.projectPolicy),/排除项/);
});
