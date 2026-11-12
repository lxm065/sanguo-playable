'use strict';
const config=require('./deployment-config');
/** 恢复被拖动的既有节点及层级，不重建战场模型、提示或装备栏。 */
function restore(actor,origin){if(!actor.node.isValid)return;actor.node.setPosition(origin.x,origin.y);if(origin.sibling!==undefined)actor.node.setSiblingIndex(origin.sibling);}
/** 只读预检失败直接提示；合法落子继续使用原有事务和成功刷新流程。 */
function submit(view,actor,uid,point,origin){
 try{
  view.model.storage.assertWritable?.();
  const slot=view.slotAt(point),layout=view.config.layout,target=slot!==null?slot:point.y<layout.benchDropTop&&point.y>layout.benchDropBottom?-1:null;
  if(target===null)throw Error(config.invalidDrop);
  view.model.checkDeployment(uid,target);
  view.act(()=>view.model.deploy(uid,target));return true;
 }catch(error){restore(actor,origin);if(!require('./cloud-save-ui').handleError(view,error))view.notice(config.title,error.message);return false;}
}
module.exports={submit,restore};
