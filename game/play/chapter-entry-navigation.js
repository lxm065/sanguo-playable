'use strict';
const service=require('./chapter-replay'),c=require('./chapter-entry-navigation-config');
/** 当前章直接继续，已开放的其他章经放弃进度确认，未来章保留原门槛。 */
function open(v,chapter){if(!Number.isInteger(chapter)||chapter<1||chapter>service.highest(v.progress)){v.notice(c.lockedTitle,c.lockedText.replace('{chapter}',chapter));return false;}if(chapter!==v.progress.state.chapter){require('./chapter-replay-view').show(v,chapter);return true;}v.page='map';v.mapOffset=0;v.mapSectionKey=null;v.render();return true;}
/** 图像和文案共用入口，阻断冒泡以免点击同时触发地图节点。 */
function bind(v,node,chapter){node.on(v.cc.Node.EventType.TOUCH_END,e=>{e.propagationStopped=true;open(v,chapter);});}
module.exports={open,bind};
