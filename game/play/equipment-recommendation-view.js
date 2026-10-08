'use strict';
const c=require('./battle-hud-config').targeting;
/** 远征与挑战共用推荐标签，依附武将节点，释放或取消后由调用者清理。 */
function show(v,item,units,equipment){return require('./battle-hud-query').recommendedUnits(item,units,equipment).flatMap(uid=>{const actor=v.actors.get(uid);if(!actor)return [];const n=v.ui.box(actor.node,'equipment-recommended',0,c.recommendY,c.recommendWidth,c.recommendHeight,c.background);v.ui.text(n,'推荐',0,0,c.recommendFont,c.textColor,c.recommendWidth-6,c.recommendHeight);return [n];});}
module.exports={show};
