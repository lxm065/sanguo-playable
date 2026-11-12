'use strict';
const failures=new WeakMap();
/** 与回滚快照共用一次序列化，同时记录引用次序，识别同值替换等隐藏修改。 */
function capture(state){const references=[],text=JSON.stringify(state,function remember(key,value){if(value&&typeof value==='object')references.push(value);return value;});return {state,references,text,value:JSON.parse(text)};}
/** 数值、字段、数组顺序和每个对象引用均相同，才认定没有发生修改。 */
function unchanged(state,snapshot){if(state!==snapshot.state)return false;let index=0,same=true;try{const text=JSON.stringify(state,function compare(key,value){if(value&&typeof value==='object'&&snapshot.references[index++]!==value)same=false;return value;});return same&&index===snapshot.references.length&&text===snapshot.text;}catch{return false;}}
/** 无修改时保留原状态和查询缓存；真正修改后的失败仍换回完整快照。 */
function rollback(model,error,snapshot){const retained=unchanged(model.state,snapshot);if(!retained)model.state=snapshot.value;if(error&&(typeof error==='object'||typeof error==='function'))failures.set(error,{model,state:model.state,revision:model.revision||0,retained});}
/** 保存动作起点，防止先成功提交再失败、换模型或跨页面的异常误走保留路径。 */
function scope(model){return {model,state:model?.state,revision:model?.revision||0};}
/** 只接受本模型事务产生的证据；未知异常按原流程恢复界面。 */
function retained(model,error,before){const proof=error&&(typeof error==='object'||typeof error==='function')?failures.get(error):null;return !!(proof?.retained&&before?.model===model&&proof.model===model&&before.state===model.state&&proof.state===model.state&&before.revision===(model.revision||0)&&proof.revision===(model.revision||0));}
module.exports={capture,unchanged,rollback,scope,retained};
