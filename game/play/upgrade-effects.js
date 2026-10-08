'use strict';
const config=require('./native-effect-config').levelup;
/** 比较已提交事务前后的阶级，只给真实升阶且当前可见的角色播放原生升级动画。 */
function show(view,previous,units=view.model.state.units){
 for(const unit of units){
  if(!previous.has(unit.uid)||unit.star<=previous.get(unit.uid))continue;
  const actor=view.actors.get(unit.uid);if(!actor?.node.isValid)continue;
  require('./upgrade-feedback').play(view,actor.node,'hero',0,config.offsetY);
 }
}
module.exports={show};
