'use strict';
const config=require('./interaction-performance-config');
/** 仅在连续备战重绘时暂存已装配的身体；交战、结算、换页均重新建立生命周期。 */
function begin(view){
 const preparing=view.page==='battle'&&!view.playing&&!view.startingBattle&&!view.model.state.pending;
 if(!config.reusePreparationBodies||!preparing||!view.preparationRendered)return null;
 const pool=new Map();
 for(const [uid,actor] of view.actors){if(!actor.body?.isValid||!actor.sp?.skeletonData||!actor.bodyKey)continue;actor.body.removeFromParent();pool.set(uid,{body:actor.body,sp:actor.sp,key:actor.bodyKey});}
 view.ui.preparationBodies=pool;return pool;
}
/** 相同实例、身份和阶级才复用骨骼，其他节点及触摸处理仍按新状态创建。 */
function take(widgets,unit,parent){const pool=widgets.preparationBodies,entry=pool?.get(unit.uid);if(!entry||entry.key!==key(unit)||!entry.body.isValid)return null;pool.delete(unit.uid);parent.addChild(entry.body);return entry;}
/** 捕获构建时的外观键，防止原地升级后旧对象同步变化而误复用。 */
function key(unit){return JSON.stringify([unit.heroId,unit.star]);}
/** 释放被合成或翻出可见范围的身体；缓存只活在一次同步渲染内。 */
function end(view,pool){if(pool){for(const entry of pool.values())if(entry.body.isValid)entry.body.destroy();pool.clear();if(view.ui.preparationBodies===pool)view.ui.preparationBodies=null;}view.preparationRendered=view.page==='battle'&&!view.playing&&!view.startingBattle&&!view.model.state.pending;}
module.exports={begin,take,key,end};
