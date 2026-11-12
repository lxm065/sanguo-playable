'use strict';
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),{createRequire}=require('node:module');
const qaRequire=createRequire(path.join(__dirname,'wechat-babel-qa/package.json'));

/** 按微信增强编译使用的目标环境转换，并保留其 CommonJS helper 导入语义。 */
function transform(source, filename) {
 return qaRequire('@babel/core').transformSync(source,{
  filename,babelrc:false,configFile:false,
  presets:[[qaRequire('@babel/preset-env'),{targets:{chrome:53,ios:8},modules:false,include:['@babel/plugin-transform-computed-properties']}]],
  plugins:[[qaRequire('@babel/plugin-transform-runtime'),{corejs:false,helpers:true,regenerator:true,version:'7.21.0'}],[qaRequire('@babel/plugin-transform-modules-commonjs'),{importInterop:'node'}]],
 }).code;
}

/** 对齐开发者工具 ignore 的目录通配规则，不将已编译 helper 再送入转换。 */
function ignored(filename, project) {
 return (project.setting.babelSetting?.ignore || []).some(pattern=>filename===pattern || (!/^[./\\]+/.test(pattern) && /.+\/\*$/.test(pattern) && filename.includes(pattern.slice(0,-1))));
}

/** 用隔离的 CommonJS 缓存执行真实 helper 链和对象展开，重现首帧前的配置加载错误。 */
function smoke(root, project) {
 const cache=new Map(),sources=new Map(),context=vm.createContext({});
 /** 解析发布包内的运行库；未提交导出前先缓存模块，以暴露循环依赖。 */
 function load(filename) {
  if (cache.has(filename)) return cache.get(filename).exports;
  const file=path.join(root,filename),appended=filename.startsWith('@babel/runtime/')&&!fs.existsSync(file);
  const source=filename==='startup-spread.js'?'module.exports = {...{hp:100}, attack:20};':fs.readFileSync(appended?qaRequire.resolve(filename.slice(0,-3)):file,'utf8');
  if(filename.endsWith('.json')){const value=JSON.parse(source);cache.set(filename,{exports:value});return value;}
  // 微信对转换时新增的 helper 直接追加，不再经过第二次编译。
  const code=appended||ignored(filename,project)?source:transform(source,filename),module={exports:{}};
  sources.set(filename,code);cache.set(filename,module);
  /** 仅允许当前发布包内的相对依赖和编译器生成的 Babel helper。 */
  function localRequire(id) {
   const target=id.startsWith('@babel/runtime/')?id:path.posix.normalize(path.posix.join(path.posix.dirname(filename),id));
   if (target.startsWith('../') || path.posix.isAbsolute(target)) throw Error('依赖超出发布包：'+id);
   return load(/\.(js|json)$/.test(target)?target:target+'.js');
  }
  vm.runInContext('(function(require,module,exports){\n'+code+'\n})',context,{filename})(localRequire,module,module.exports);
  return module.exports;
 }
 const value=load('startup-spread.js');
 if (value.hp!==100 || value.attack!==20) throw Error('对象展开配置加载失败');
 // 覆盖字符串、Symbol 和自定义键转换，不能只验证一次 require 没报错。
 const type=load('@babel/runtime/helpers/typeof.js'),key=load('@babel/runtime/helpers/toPropertyKey.js');
 if (type(Symbol('qa'))!=='symbol' || type({})!=='object' || key({toString(){return 'qa';}})!=='qa') throw Error('Babel 运行库语义错误');
 const expedition=load('play/expedition-config.js');
 if(!expedition.models.length||!expedition.equipment.length)throw Error('远征配置加载不完整');
 return {modules:cache.size,objectSpread:value,models:expedition.models.length,equipment:expedition.equipment.length,helperSelfImport:/require\(["'][^"']*helpers\/typeof/.test(sources.get('@babel/runtime/helpers/typeof.js'))};
}

/** 检查指定发布目录的配置和运行库执行结果，供发布前独立验收。 */
function verify(root) {
 const project=JSON.parse(fs.readFileSync(path.join(root,'project.config.json'),'utf8'));
 require('./wechat-project-policy.cjs').verify(project,require('./wechat-release.config.json').projectPolicy);
 const result={project:path.resolve(root),...smoke(root,project)};
 if (result.helperSelfImport) throw Error('运行库出现自导入');
 return result;
}

if(require.main===module)console.log(JSON.stringify(verify(path.resolve(process.argv[2]||require('./wechat-release.config.json').output)),null,2));
module.exports={transform,ignored,smoke,verify};
