'use strict';
const policy=require('./action-feedback-config'),state=require('./transaction-state');
/** 在动作开始时记录当前领域模型和已提交版本，不保存额外大快照。 */
function begin(model,view){return {...state.scope(model),view,page:view?.page,screen:view?.screen,rendered:view?.renderedActionState};}
/** 记录实际重绘完成时的版本；旧界面遇到拒绝仍需刷新，避免保留过期按钮闭包。 */
function rendered(view,model=view.model){view.renderedActionState=state.scope(model);}
/** 事务确认未修改且没有中间提交时，允许跳过整个页面重建。 */
function canRetain(model,error,before){const stamp=before?.rendered,view=before?.view;return policy.retainUnchangedFailures&&(!stamp||stamp.model===model&&stamp.state===before.state&&stamp.revision===before.revision)&&(!view||view.page===before.page&&view.screen===before.screen)&&state.retained(model,error,before);}
/** 通用远征失败只新增轻量提示层；有回滚或未知副作用时保留原重绘出口。 */
function notice(view,error,before){if(require('./cloud-save-ui').handleError(view,error))return;const preserve=canRetain(view.model,error,before);if(!preserve)view.render();view.notice(policy.title,error.message,{preserve});}
/** 挑战提示只更新一个标签，不销毁棋盘、装备或准备倒计时。 */
function challengeMessage(view,text,layout=policy.challenge){const c=layout;view.message=text;if(view.actionMessage?.node?.isValid){view.actionMessage.string=text;return;}if(!view.root?.isValid)return;view.actionMessage=view.ui.text(view.root,text,c.x,view.screen==='decks'?require('./challenge-config').deckLayout.messageY:c.y,c.font,c.color,c.width,c.height);if(view.actionMessage.node)view.actionMessage.node.name=c.name;}
/** 挑战各失败出口统一保留无修改页面，确有回滚时仍重建当前挑战画布。 */
function challenge(view,error,before){if(view.host&&require('./cloud-save-ui').handleError(view.host,error))return;if(canRetain(view.service.model,error,before)){challengeMessage(view,error.message);return;}view.message=error.message;view.render();}
module.exports={begin,rendered,canRetain,notice,challengeMessage,challenge};
