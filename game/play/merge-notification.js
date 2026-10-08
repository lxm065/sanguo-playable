'use strict';
/** 合成条件与棋子箭头共用，备战席也计入，结算或交战期间不提示不可执行操作。 */
function ready(v){return !v.playing&&!v.model.state.pending&&require('./merge-hints').eligible(v.model).size>0;}
/** 在羁绊标题右上角显示共用红点样式，不遮挡羁绊人数。 */
function show(v,parent){const c=require('./battle-hud-config').bonds.mergeDot;return require('./notification-view').badge(v,parent,'merge',c.x,c.y,()=>ready(v));}
module.exports={ready,show};
