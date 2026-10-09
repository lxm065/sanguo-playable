'use strict';
/** 胜利待领奖不显示敌军；领奖后仅进入明确的新战斗节点才生成预览。 */
function preview(state){return !state.pending&&!!state.meta?.activeNode&&!state.meta?.nodeEvent;}
/** 战败保留真实战报，胜利不再重建已结束战斗的敌军演员。 */
function showResult(state,unit){return !(state.pending?.battle?.result==='win'&&unit.side==='enemy');}
module.exports={preview,showResult};
