'use strict';
/** 仅整章最终首领正式胜利跳过局内选将，兼容尚未领取的旧战报。 */
function skip(model,pending=model.state.pending){
 if(!pending||pending.training||pending.battle.result!=='win'||!model.progression)return false;
 const progress=model.progression;
 return progress.state.section===progress.config.chapter.sections.length&&progress.nodes().some(n=>n.id===progress.state.activeNode&&n.type==='boss');
}
module.exports={skip};
